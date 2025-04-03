from django.urls import path
from . import views

urlpatterns = [
    path('todays_intake/', views.dashboard_data_todays_intake, name='todays_intake'),
    path('top_n_foods/<int:count>/', views.dashboard_top_foods, name='top_n_foods'),
    path('top_n_stores/<int:count>/', views.dashboard_top_stores, name='top_n_stores'),
    path('weekly_comparison/', views.weekly_comparison, name='weekly_comparison'),
    path('today_water_chart/', views.today_water_intake_chart, name='today_water_chart'),
    path('yearly_water_chart/', views.yearly_water_intake_chart, name='yearly_water_chart'),

]