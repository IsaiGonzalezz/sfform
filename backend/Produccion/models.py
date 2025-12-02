from django.db import models
from Formulas.models import Formulas
from Usuarios.models import Usuario
from Ingredientes.models import Ingredientes

# --- Modelo 
class Produccion(models.Model):
    folio = models.AutoField(primary_key=True)
    op = models.CharField(max_length=20)
    idform = models.ForeignKey(
        Formulas, 
        on_delete=models.SET_NULL, # Usamos SET_NULL para evitar borrados en cascada no deseados
        db_column='IdForm',         # Nombre de la columna en la BD
        null=True,                  # Permitir nulo en la BD
        blank=True,                 # Permitir vacío en formularios de Django
        related_name='producciones_formula'
    )
    
    lote = models.CharField(max_length=50, null=True, blank=True)
    pesform = models.FloatField(null=True, blank=True)
    estatus = models.IntegerField(default=0)
    
    fecha = models.DateTimeField()

    # Apunta al campo 'id' entero del modelo Usuario.
    idusu = models.ForeignKey(
        Usuario, 
        on_delete=models.SET_NULL, # Recomendado: si el usuario es borrado, se pone NULL aquí.
        db_column='IdUsu',         # Nombre de la columna en la BD (coincide con tu SQL)
        related_name='producciones_creadas',
        null=True,                 # Permitir nulo en la BD
        blank=True
    )
    
    class Meta : 
        db_table = 'Produccion'
        managed = False # Mantienes la gestión de la tabla fuera de Django




class DetalleProduccion(models.Model):
    # Clave Primaria
    iddetalleproduccion = models.AutoField(primary_key=True)
    
    # Clave Foránea a Producción (apunta a Folio)
    folioproduccion = models.ForeignKey(
        Produccion,
        on_delete=models.CASCADE,
        db_column='FolioProduccion', # Nombre exacto de la columna en la BD
        related_name='detalles'
    )
    
    # Clave Foránea a Ingredientes
    iding = models.ForeignKey(
        Ingredientes,
        on_delete=models.CASCADE,
        db_column='IdIng', # Nombre exacto de la columna en la BD
        related_name='detalles_produccion'
    )
    
    # Campos de datos
    pesing = models.FloatField(null=True, blank=True)
    pmax = models.FloatField(null=True, blank=True)
    pmin = models.FloatField(null=True, blank=True)
    pesado = models.IntegerField(default=0) # tinyint/Pesado
    
    class Meta:
        db_table = 'Detalle_Produccion'
        managed = False