from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('signin/', views.sign_in, name='signin'),
    path('signup/', views.sign_up, name='signup'),
    path('signout/', views.signout, name='signout'),
    path('water-logging/', views.water_logging, name='waterLogging'),
    path('onboarding-quiz/', views.onboarding_quiz, name='onboarding_quiz'),
    path('update-profile/', views.update_profile, name='update_profile'),
    path('food_logging/', views.food_logging, name='food_logging'),
]
