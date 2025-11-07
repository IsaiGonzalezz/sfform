from django.db import models
from Ingredientes.models import Ingredientes


class Formulas (models.Model):
    idform = models.CharField(max_length=20,primary_key=True)
    folio = models.CharField(max_length=20)
    nombre = models.CharField(max_length=50)

    class Meta : 
        db_table = 'Formulas'
        managed = False

class Detalle_Formula (models.Model) : 
    iddetalle = models.AutoField(primary_key=True)
    cantidad = models.FloatField()
    tolerancia = models.IntegerField()
    idform = models.ForeignKey(Formulas, on_delete=models.CASCADE, db_column='idform')
    iding = models.ForeignKey(Ingredientes, on_delete=models.CASCADE, db_column='iding')

    class Meta : 
        db_table = 'Detalle_Formula'
        managed = False