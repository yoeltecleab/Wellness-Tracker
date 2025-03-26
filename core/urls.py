from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('signup/', views.signUp, name='signup'),
    path('signin/', views.signUp, name='signin'),
    path('water-logging/', views.waterLogging, name='waterLogging'),
    path('onboarding-quiz/', views.onboarding_quiz, name='onboarding_quiz'),
]
