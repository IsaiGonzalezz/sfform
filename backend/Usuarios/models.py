from django.db import models

# Create your models here.

class Usuario(models.Model):
    rfid = models.CharField(max_length=20, primary_key=True)
    nombre = models.CharField(max_length=50)
    correo = models.CharField(max_length=50)
    contraseña = models.CharField(max_length=256)
    rol = models.CharField(max_length=50)

    class Meta:
        db_table = 'Usuarios'
        managed = False
