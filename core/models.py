
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


# Create your models here.
class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=100, blank=True, null=True)

    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=10, blank=True, null=True)
    dob = models.DateField(null=True, blank=True)

    avatar = models.ImageField(null=True, default="avatar.svg")

    created_at = models.DateTimeField(default=timezone.now)
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
    default_foods = models.CharField(max_length=100, blank=True, null=True)

    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=True, null=True, related_name='user_profile')

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'


class WaterLog(models.Model):
    amount = models.IntegerField(blank=True, null=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='water_logs')

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Water Log'
        verbose_name_plural = 'Water Logs'


class FoodEntry(models.Model):
    entry_id = models.CharField(max_length=100, blank=True, null=True)
    food_name = models.CharField(max_length=100, blank=True, null=True)
    calories = models.IntegerField(blank=True, null=True)
    purchased = models.BooleanField(blank=True, null=True, default=False)
    purchased_from = models.ForeignKey('Store', on_delete=models.CASCADE,
                                       blank=True, null=True, related_name='food_entries')
    health_rating = models.CharField(max_length=100, blank=True, null=True)
    meal_type = models.CharField(max_length=100, blank=True, null=True)
    notes = models.CharField(max_length=100, blank=True, null=True)
    protein = models.IntegerField(blank=True, null=True)
    carbs = models.IntegerField(blank=True, null=True)
    fat = models.IntegerField(blank=True, null=True)
    frequency = models.IntegerField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True, default=True)
    is_quick_add = models.BooleanField(blank=True, null=True, default=False)
    is_default = models.BooleanField(blank=True, null=True, default=False)

    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='food_entries')

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Food Entry'
        verbose_name_plural = 'Food Entries'


class Store(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=100, blank=True, null=True)
    visits = models.IntegerField(blank=True, null=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='stores')

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Store'
        verbose_name_plural = 'Stores'


class Goal(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=True, null=True, related_name='goal')
    calorie_goal = models.IntegerField(blank=True, null=True)
    water_goal = models.IntegerField(blank=True, null=True)
    protein_goal = models.IntegerField(blank=True, null=True)
    carbs_goal = models.IntegerField(blank=True, null=True)
    fat_goal = models.IntegerField(blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Goal'
        verbose_name_plural = 'Goals'