from django.urls import path
from . import views

urlpatterns = [
    path('todays_intake/<str:email>/', views.dashboard_data_todays_intake, name='todays_intake'),
    path('top_n_foods/<str:email>/<int:count>/', views.dashboard_top_foods, name='top_n_foods'),
    path('top_n_stores/<str:email>/<int:count>/', views.dashboard_top_stores, name='top_n_stores'),
    path('weekly_comparison/<str:email>/', views.weekly_comparison, name='weekly_comparison'),
    path('today_water_chart/<str:email>/', views.today_water_intake_chart, name='today_water_chart'),
    path('yearly_water_chart/<str:email>/', views.yearly_water_intake_chart, name='yearly_water_chart'),

]