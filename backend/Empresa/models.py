from django.db import models

# Create your models here.
# Create your models here.
class Empresa(models.Model):
    rfc = models.CharField(max_length=20, primary_key=True)
    nombre = models.CharField(max_length=50)
    calle = models.CharField(max_length=50)
    colonia = models.CharField(max_length=50)
    ciudad = models.CharField(max_length=50)
    estado = models.CharField(max_length=50)
    cp = models.CharField(max_length=7)
    contacto = models.CharField(max_length=50)
    correo = models.CharField(max_length=50)
    telefono = models.CharField(max_length=20)
    logotipo = models.ImageField(upload_to='logos_empresa/', blank=True, null=True)

    class Meta :
        db_table = 'Empresa'
        managed = False