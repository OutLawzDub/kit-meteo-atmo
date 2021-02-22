## Installation

Executez la commande

```bash
npm install
```

## Usage

Il faut commencer par modifier le fichier de configuration ./config/ftp.json

```json
{
    "path": {
        "dev": "/kit-meteo/",
        "production": "/kit-atmo/"
    },
    "dev": {
        "host": "FTP_DEV",
        "user": "USER",
        "password": "PASSWORD"
    },
    "production": {
        "host": "FTP_PROD",
        "user": "USER",
        "password": "PASSWORD"
    }
}

```
