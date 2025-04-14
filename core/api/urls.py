from django.urls import path
from . import views

urlpatterns = [
    # Check for demo user
    path('check-demo-user/', views.check_demo_user),

    # Dashboard APIs
    path('todays_intake/', views.dashboard_data_todays_intake),
    path('top_n_foods/<int:count>/', views.dashboard_top_foods),
    path('top_n_stores/<int:count>/', views.dashboard_top_stores),
    path('weekly_comparison/', views.weekly_comparison),
    path('today_water_chart/', views.today_water_intake_chart),
    path('yearly_water_chart/', views.yearly_water_intake_chart),

    # Food Entries APIs
    # save new entry - POST
    path('food-entries/add/', views.food_entries),
    # get all entries on the given date - GET
    path('food-entries/<str:date>/', views.food_entries),
    # delete an entry with the given id - DELETE
    path('food-entries/delete/<str:entryId>/', views.food_entries),

    # Water Entries APIs
    # save new entry - POST
    path('water-entries/', views.water_entries),
    # get all entries on the given date - GET
    path('water-entries/<str:date>/', views.water_entries),
    # delete an entry with the given id - DELETE
    path('water-entries/delete/<str:entryId>/', views.water_entries),

    # Food and Store Database APIs
    path('food-database/', views.food_database),
    path('store-database/', views.store_database),

    # Quick Add Food APIs
    path('quick-add-foods/', views.quick_add_foods),
    path('quick-add-foods/<str:itemId>/', views.quick_add_foods),

    # Water Containers APIs
    path('water-containers/', views.water_containers),
    path('water-containers/<str:containerId>/', views.water_containers),


    # Weekly Data APIs
    path('weekly-data/<int:daysBack>/', views.weekly_data),

    # Goals APIs
    path('goals/', views.goals),

    # Settings APIs
    path('settings/', views.settings),

    # Clear Data API
    path('clear-data/', views.clear_data),

    path('import-data/', views.import_data_from_json),
    path('export-data/', views.export_data_to_json),

    path('data/', views.exported_data),
]