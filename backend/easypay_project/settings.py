import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-dev-key')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

ALLOWED_HOSTS = ['*']

# Application definition - MINIMAL FOR MONGODB
INSTALLED_APPS = [
    'django_mongodb_backend',
    'django.contrib.sessions',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'easypay_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
            ],
        },
    },
]

WSGI_APPLICATION = 'easypay_project.wsgi.application'

# Database - MongoDB Atlas
MONGODB_URL = os.getenv('MONGODB_URL', '')

DATABASES = {
    'default': {
        'ENGINE': 'django_mongodb_backend',
        'NAME': 'easypay_db',
        'HOST': MONGODB_URL,
    }
}

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django_mongodb_backend.fields.ObjectIdAutoField'

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    FRONTEND_URL,
]
CORS_ALLOW_ALL_ORIGINS = False # Must be False for CORS_ALLOW_CREDENTIALS
CORS_ALLOW_CREDENTIALS = True

# AGGRESSIVE DRF SETTINGS TO DISABLE AUTH DEPENDENCIES
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser'],
    'UNAUTHENTICATED_USER': None,
}

SILENCED_SYSTEM_CHECKS = ["mongodb.E001"]

# Use cookies for sessions for Scan & Go
SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'
