from django.contrib.auth.models import AbstractUser
from django.db import models
from hashlib import sha256


# Create your models here.
class Profile(models.Model):
    firstName = models.CharField(max_length=100, blank=True)
    lastName = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=100, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return sha256(self.full_details().encode()).hexdigest()

    class Meta:
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'

    def full_details(self):
        return self.firstName + self.lastName + self.email + self.phone


class User(AbstractUser):
    email = models.EmailField(unique=True)
    avatar = models.ImageField(null=True, default="avatar.svg")
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, blank=True, null=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return sha256(self.profile.full_details().encode()).hexdigest()
