from django.db import models
from Estaciones.models import Estaciones

# Create your models here.
class Operadores(models.Model):
    rfid = models.CharField(max_length=20, primary_key=True)
    nombre = models.CharField(max_length=50)
    contraseña = models.CharField(max_length=256)
    idest = models.ForeignKey(Estaciones, on_delete=models.CASCADE, db_column='idest')

    class Meta:
        db_table = 'Operadores'
        managed = False