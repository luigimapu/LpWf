// Minimal fallback to ensure ticket buttons trigger visible network calls
(function() {
  function pushLog(method, endpoint, note) {
    try {
      var box = document.getElementById('api-log-list');
      if (!box) return;
      var row = document.createElement('div');
      row.className = 'api-log-item';
      var t = new Date();
      var time = document.createElement('span');
      time.className = 'api-log-time';
      time.textContent = t.toTimeString().split(' ')[0] + '.' + String(t.getMilliseconds()).padStart(3,'0');
      var met = document.createElement('span'); met.className = 'api-log-met'; met.textContent = method;
      var url = document.createElement('span'); url.className = 'api-log-url'; url.textContent = endpoint;
      var sta = document.createElement('span'); sta.className = 'api-log-sta'; sta.textContent = note || '';
      row.appendChild(time); row.appendChild(met); row.appendChild(url); row.appendChild(sta);
      box.insertBefore(row, box.firstChild);
    } catch (e) {}
  }
  function computeApiBase() {
    try {
      if (window.lpwfAuth && typeof window.lpwfAuth.getApiBase === 'function') {
        return String(window.lpwfAuth.getApiBase() || '/api').replace(/\/$/, '');
      }
    } catch (e) {}
    try {
      var path = window.location.pathname;
      var basePath = path.replace(/\/[^/]*$/, '');
      var norm = basePath.endsWith('/api') ? basePath : (basePath.replace(/\/$/, '') + '/api');
      return (window.location.origin + norm).replace(/\/$/, '');
    } catch (e) { return '/api'; }
  }
  function setLast(msg) {
    try { var el = document.getElementById('status-api-last'); if (el) el.textContent = msg; } catch (e) {}
  }
  function safeAdd(el, evt, fn) {
    if (!el) return;
    try {
      if (el.dataset && el.dataset.fbBound) return;
      el.addEventListener(evt, fn, false);
      if (el.dataset) el.dataset.fbBound = '1';
    } catch (e) {}
  }
  function postJSON(url, body) {
    try {
      var headers = { 'Content-Type': 'application/json' };
      try { var tk = (window.lpwfAuth && window.lpwfAuth.getToken && window.lpwfAuth.getToken()) || null; if (tk) headers['Authorization'] = 'Bearer ' + tk; } catch (e3) {}
      return fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body||{}) }).then(function(r){ try{ pushLog('POST', url.replace(/^.*\/api\//,''), String(r.status)); }catch(e){} return r; });
    } catch (e) { try { var xhr=new XMLHttpRequest(); xhr.open('POST', url, true); xhr.setRequestHeader('Content-Type','application/json'); try{ var tk2=(window.lpwfAuth&&window.lpwfAuth.getToken&&window.lpwfAuth.getToken())||null; if(tk2) xhr.setRequestHeader('Authorization','Bearer '+tk2);}catch(e4){} xhr.send(JSON.stringify(body||{})); } catch (e2) {} }
  }
  function get(url) {
    try {
      var headers = {};
      try { var tk = (window.lpwfAuth && window.lpwfAuth.getToken && window.lpwfAuth.getToken()) || null; if (tk) headers['Authorization'] = 'Bearer ' + tk; } catch (e3) {}
      return fetch(url, { headers: headers }).then(function(r){ try{ pushLog('GET', url.replace(/^.*\/api\//,''), String(r.status)); }catch(e){} return r; });
    } catch (e) { try { var xhr=new XMLHttpRequest(); xhr.open('GET', url, true); try{ var tk2=(window.lpwfAuth&&window.lpwfAuth.getToken&&window.lpwfAuth.getToken())||null; if(tk2) xhr.setRequestHeader('Authorization','Bearer '+tk2);}catch(e4){} xhr.send(null); } catch (e2) {} }
  }
  function onReady() {
    var base = computeApiBase();
    var btnRefresh = document.getElementById('btn-tickets-refresh');
    var btnCreate = document.getElementById('btn-ticket-create');
    safeAdd(btnRefresh, 'click', function(ev){ setLast('GET health … (fallback)'); pushLog('GET', 'health', '…'); get(base + '/health'); });
    safeAdd(btnCreate, 'click', function(ev){
      var t = document.getElementById('ticket-title');
      var d = document.getElementById('ticket-desc');
      var p = document.getElementById('ticket-priority');
      var body = { titolo: (t&&t.value? t.value : 'Ticket (fallback)'), descrizione: (d&&d.value)||'', priorita: (p&&p.value)||'MEDIA' };
      setLast('POST tickets … (fallback)'); pushLog('POST', 'tickets', '…');
      postJSON(base + '/tickets', body);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
