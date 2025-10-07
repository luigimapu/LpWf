<?php
require_once __DIR__ . '/HttpClient.php';

class EnrichmentService
{
    public function searchMedia(string $query, int $limit = 10, string $lang = 'it', array $options = []): array
    {
        $limit = max(1, min(20, $limit));

        // Opzioni: providers (array di 'wikimedia','unsplash','pexels'), prefer (string)
        $allowedProviders = ['wikimedia','unsplash','pexels'];
        $filterProviders = isset($options['providers']) && is_array($options['providers'])
            ? array_values(array_intersect(array_map('strtolower', $options['providers']), $allowedProviders))
            : [];
        $prefer = isset($options['prefer']) ? strtolower((string)$options['prefer']) : '';

        // Colleziona risultati per provider separatamente (rispettando eventuale filtro)
        $want = $filterProviders ?: $allowedProviders;
        $sets = [];
        if (in_array('wikimedia', $want, true)) {
            try { $sets['wikimedia'] = $this->searchWikimediaCommons($query, $limit, $lang); } catch (Throwable $e) { $sets['wikimedia'] = []; }
        }
        if (in_array('unsplash', $want, true)) {
            $unsplashKey = getenv('UNSPLASH_ACCESS_KEY') ?: '';
            if ($unsplashKey) {
                try { $sets['unsplash'] = $this->searchUnsplash($query, $limit, $unsplashKey); } catch (Throwable $e) { $sets['unsplash'] = []; }
            }
        }
        if (in_array('pexels', $want, true)) {
            $pexelsKey = getenv('PEXELS_API_KEY') ?: '';
            if ($pexelsKey) {
                try { $sets['pexels'] = $this->searchPexels($query, $limit, $pexelsKey); } catch (Throwable $e) { $sets['pexels'] = []; }
            }
        }

        // Interleava i provider (round-robin) e deduplica per URL
        $providers = array_filter($sets, fn($arr) => is_array($arr) && count($arr) > 0);
        if (empty($providers)) { return []; }

        // Trasforma in liste indicizzate
        $queues = [];
        foreach ($providers as $name => $arr) { $queues[$name] = array_values($arr); }

        // Se prefer impostato, riordina la sequenza round-robin mettendo il provider preferito per primo
        if ($prefer && isset($queues[$prefer])) {
            $ordered = [$prefer];
            foreach (array_keys($queues) as $n) { if ($n !== $prefer) { $ordered[] = $n; } }
            // Ricrea $queues nell'ordine desiderato
            $queues = array_merge([], array_combine($ordered, array_map(fn($n) => $queues[$n], $ordered)));
        }

        $result = [];
        $seen = [];
        while (count($result) < $limit) {
            $progress = false;
            foreach ($queues as $name => &$queue) {
                if (count($queue) === 0) { continue; }
                $item = array_shift($queue);
                $url = (string)($item['url'] ?? '');
                if ($url !== '' && !isset($seen[$url])) {
                    $seen[$url] = true;
                    $result[] = $item;
                    $progress = true;
                    if (count($result) >= $limit) { break 2; }
                }
            }
            unset($queue);
            if (!$progress) { break; } // tutte le code esaurite o solo duplicati
        }

        return $result;
    }

    private function searchWikimediaCommons(string $query, int $limit, string $lang): array
    {
        $url = 'https://commons.wikimedia.org/w/api.php'
            . '?action=query&format=json&prop=imageinfo|info'
            . '&generator=search&gsrnamespace=6'
            . '&iiprop=url|mime|extmetadata'
            . '&iiurlwidth=320&iiurlheight=320'
            . '&gsrlimit=' . urlencode((string)$limit)
            . '&gsrsearch=' . urlencode($query);
        [$status, $body] = HttpClient::get($url, ['User-Agent' => 'LpWF/1.0 (+contact)']);
        if ($status !== 200) return [];
        $json = json_decode($body, true);
        $pages = $json['query']['pages'] ?? [];
        $out = [];
        foreach ($pages as $p) {
            $info = $p['imageinfo'][0] ?? null;
            if (!$info || empty($info['url'])) continue;
            // Filtra formati poco adatti al browser (es. TIFF)
            $mime = strtolower((string)($info['mime'] ?? ''));
            $allowed = ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml'];
            if ($mime && !in_array($mime, $allowed, true)) {
                continue;
            }
            $meta = $info['extmetadata'] ?? [];
            $license = $meta['LicenseShortName']['value'] ?? ($meta['License']['value'] ?? '');
            $desc = strip_tags($meta['ImageDescription']['value'] ?? '');
            $thumb = $info['thumburl'] ?? $info['url'];
            $out[] = [
                'title' => $p['title'] ?? 'Wikimedia File',
                'url' => $info['url'],
                'thumbnail' => $thumb,
                'source' => 'Wikimedia Commons',
                'license' => $license,
                'description' => $desc,
                'attribution' => $meta['Artist']['value'] ?? '',
            ];
        }
        return $out;
    }

    private function searchUnsplash(string $query, int $limit, string $key): array
    {
        $url = 'https://api.unsplash.com/search/photos?per_page=' . urlencode((string)$limit)
             . '&query=' . urlencode($query) . '&client_id=' . urlencode($key);
        [$status, $body] = HttpClient::get($url, ['Accept-Version' => 'v1']);
        if ($status !== 200) return [];
        $json = json_decode($body, true);
        $res = $json['results'] ?? [];
        $out = [];
        foreach ($res as $r) {
            $out[] = [
                'title' => $r['alt_description'] ?? 'Unsplash Image',
                'url' => $r['urls']['regular'] ?? $r['urls']['small'] ?? $r['urls']['raw'] ?? '',
                'thumbnail' => $r['urls']['small'] ?? $r['urls']['thumb'] ?? '',
                'source' => 'Unsplash',
                'license' => 'Unsplash License',
                'description' => $r['description'] ?? $r['alt_description'] ?? '',
                'attribution' => $r['user']['name'] ?? '',
            ];
        }
        return $out;
    }

    private function searchPexels(string $query, int $limit, string $key): array
    {
        $url = 'https://api.pexels.com/v1/search?per_page=' . urlencode((string)$limit)
             . '&query=' . urlencode($query);
        [$status, $body] = HttpClient::get($url, ['Authorization' => $key]);
        if ($status !== 200) return [];
        $json = json_decode($body, true);
        $photos = $json['photos'] ?? [];
        $out = [];
        foreach ($photos as $p) {
            $out[] = [
                'title' => ($p['alt'] ?? 'Pexels Image'),
                'url' => $p['src']['large'] ?? $p['src']['original'] ?? '',
                'thumbnail' => $p['src']['medium'] ?? $p['src']['small'] ?? '',
                'source' => 'Pexels',
                'license' => 'Pexels License',
                'description' => $p['alt'] ?? '',
                'attribution' => $p['photographer'] ?? '',
            ];
        }
        return $out;
    }
}
