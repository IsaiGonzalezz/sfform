"""
URL configuration for formulacion_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from django.conf import settings # <-- Importa settings
from django.conf.urls.static import static # <-- Importa static

urlpatterns = [
    #path('admin/', admin.site.urls),
    path('api/', include('Usuarios.urls')),
    path('api/', include('Empresa.urls')),
    path('api/', include('Estaciones.urls')),
    #path('api/', include('Formulas.urls')),
    path('api/', include('Ingredientes.urls')),
    path('api/', include('Operadores.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)