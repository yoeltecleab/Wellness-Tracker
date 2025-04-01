from django.contrib.auth.models import AbstractUser
from django.db import models


# Create your models here.
class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=100, blank=True, null=True)

    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=10, blank=True, null=True)
    dob = models.DateField(null=True, blank=True)

    avatar = models.ImageField(null=True, default="avatar.svg")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class Profile(models.Model):
    primary_goal = models.CharField(max_length=100, blank=True, null=True)
    current_diet = models.CharField(max_length=100, blank=True, null=True)
    snacking = models.CharField(max_length=100, blank=True, null=True)
    beverages = models.CharField(max_length=100, blank=True, null=True)
    water_intake = models.CharField(max_length=100, blank=True, null=True)
    dietary_restrictions = models.CharField(max_length=100, blank=True, null=True)
    exercise = models.CharField(max_length=100, blank=True, null=True)
    usual_store = models.CharField(max_length=100, blank=True, null=True)

    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=True, null=True, related_name='user_profile')

    water_goal = models.IntegerField(blank=True, null=True)
    calorie_goal = models.IntegerField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'


class WaterLog(models.Model):
    amount = models.IntegerField(blank=True, null=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='water_logs')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Water Log'
        verbose_name_plural = 'Water Logs'


class Food(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True, unique=True)
    frequency = models.IntegerField(blank=True, null=True)
    description = models.CharField(max_length=100, blank=True, null=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='foods')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Food'
        verbose_name_plural = 'Foods'


class FoodLog(models.Model):
    food = models.ForeignKey('Food', on_delete=models.CASCADE, blank=True, null=True, related_name='food_logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='food_logs')
    is_healthy = models.BooleanField(blank=True, null=True)

    homemade_or_purchased = models.CharField(max_length=100, blank=True, null=True)
    calories = models.IntegerField(blank=True, null=True)
    purchased_from = models.ForeignKey('Store', on_delete=models.CASCADE,
                                       blank=True, null=True, related_name='food_logs')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Food Log'
        verbose_name_plural = 'Food Logs'


class Store(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    visits = models.IntegerField(blank=True, null=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='stores')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Store'
        verbose_name_plural = 'Stores'


class FoodEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Links food entries to a user
    food_name = models.CharField(max_length=255)
    calories = models.PositiveIntegerField()
    date_added = models.DateTimeField(auto_now_add=True)  # Automatically sets the timestamp

    def __str__(self):
        return f"{self.food_name} - {self.calories} cal"

    class Meta:
        verbose_name = 'Food Entry'
        verbose_name_plural = 'Food Entries'