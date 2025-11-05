from django.db import models

# Create your models here.
class Ingredientes(models.Model):
    iding = models.CharField(max_length=20,primary_key=True)
    nombre = models.CharField(max_length=50)
    presentacion = models.FloatField()
    observaciones = models.CharField(max_length=50)
    pesado = models.BooleanField()

    class Meta:
        db_table = 'Ingredientes'
        managed = False