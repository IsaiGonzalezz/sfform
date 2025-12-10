from django.db import models
from django.contrib.auth.models import AbstractBaseUser 

class Usuario(AbstractBaseUser): 
    #id = models.IntegerField(primary_key=True)
    rfid = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=50)
    correo = models.CharField(max_length=50, unique=True) 
    password = models.CharField(max_length=256)
    rol = models.CharField(max_length=50)
    last_login = models.DateTimeField(blank=True, null=True) 
    activo = models.BooleanField()

    # Propiedades requeridas por AbstractBaseUser y JWT
    USERNAME_FIELD = 'correo' 
    REQUIRED_FIELDS = ['nombre', 'rol'] 
    is_active = True
    is_staff = False
    
    def has_perm(self, perm, obj=None): return self.is_staff
    def has_module_perms(self, app_label): return self.is_staff
    
    class Meta:
        db_table = 'Usuarios'
        managed = False