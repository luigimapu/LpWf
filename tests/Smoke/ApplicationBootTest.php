<?php

declare(strict_types=1);

namespace Lpwf\Tests\Smoke;

use PHPUnit\Framework\TestCase;

final class ApplicationBootTest extends TestCase
{
    public function testDashboardScriptIsLoadable(): void
    {
        $this->assertFileExists(
            __DIR__ . '/../../dashboard.js',
            'dashboard.js non presente nella root del progetto.'
        );
    }

    public function testDotEnvFileIsReadable(): void
    {
        $envPath = __DIR__ . '/../../.env';
        $this->assertFileExists($envPath, 'File .env mancante: crea una copia da .env.example.');
        $this->assertIsReadable($envPath, 'Il file .env esiste ma non è leggibile.');
    }
}
