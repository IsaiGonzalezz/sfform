from django.db import models

# Create your models here.
class Estaciones(models.Model):
    idest = models.CharField(max_length=20, primary_key=True)
    nombre = models.CharField(max_length=50)
    obs = models.CharField(max_length=50, null=True, blank=True)

    class Meta :
        db_table = 'Estaciones'
        managed = False