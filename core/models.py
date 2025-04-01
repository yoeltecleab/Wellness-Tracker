from django.contrib.auth.models import AbstractUser
from django.db import models


# Create your models here.
class Profile(models.Model):
    primary_goal = models.CharField(max_length=100, blank=True, null=True)
    current_diet = models.CharField(max_length=100, blank=True, null=True)
    snacking = models.CharField(max_length=100, blank=True, null=True)
    beverages = models.CharField(max_length=100, blank=True, null=True)
    water_intake = models.CharField(max_length=100, blank=True, null=True)
    dietary_restrictions = models.CharField(max_length=100, blank=True, null=True)
    exercise = models.CharField(max_length=100, blank=True, null=True)
    usual_store = models.CharField(max_length=100, blank=True, null=True)
    weight_goal = models.IntegerField(blank=True, null=True)
    calorie_goal = models.IntegerField(blank=True, null=True)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'


class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=100, blank=True, null=True)

    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=10, blank=True, null=True)
    dob = models.DateField(null=True, blank=True)

    avatar = models.ImageField(null=True, default="avatar.svg")
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, blank=True, null=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class FoodEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Links food entries to a user
    food_name = models.CharField(max_length=255)
    calories = models.PositiveIntegerField()
    date_added = models.DateTimeField(auto_now_add=True)  # Automatically sets the timestamp

    def __str__(self):
        return f"{self.food_name} - {self.calories} cal" 