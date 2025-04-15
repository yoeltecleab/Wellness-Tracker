import calendar
import uuid
from collections import defaultdict
from datetime import date, timedelta, datetime

from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q, Window, F
from django.db.models.functions import RowNumber
from django.shortcuts import render
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.api.location import Location
from core.models import User, FoodEntry, Store, WaterContainer, WaterEntry, Profile, Goal

MULTIPLIER = 0.314159265358979


def switchHealthRatingToNumbers(rating):
    if rating == 'Unhealthy':
        return '1'
    elif rating == 'Neutral':
        return '2'
    elif rating == 'Healthy':
        return '3'
    else:
        return '0'


def get_favourite_foods(user: User, count):
    return FoodEntry.objects.filter(user=user).order_by('-frequency')[:count]


def get_favourite_stores(user: User, count):
    return Store.objects.filter(user=user).order_by('-visits')[:count]


def get_water_entries_from_date(user: User, date):
    return WaterEntry.objects.filter(user=user, created_at__date=date)


def get_water_entries_from_month(user: User, month, year):
    return WaterEntry.objects.filter(user=user, created_at__month=month, created_at__year=year).order_by('created_at')


def get_food_entries_from_date(user: User, date):
    return FoodEntry.objects.filter(user=user, created_at__date=date).order_by('created_at')


# checks if demo user exists
@api_view(['GET'])
def check_demo_user(request):
    exists = User.objects.filter(username='demo').exists()
    return Response({'exists': exists})


# returns data for top left card of the dashboard
@api_view(['GET'])
def dashboard_data_todays_intake(request):
    user = request.user

    # for water
    today_water_intake = sum([log.amount for log in
                              get_water_entries_from_date(user, date.today())])
    yesterday_water_intake = sum([log.amount for log in
                                  get_water_entries_from_date(user, date.today() - timedelta(days=1))])

    water_change_percentage = ((today_water_intake - yesterday_water_intake) /
                               (yesterday_water_intake if yesterday_water_intake != 0 else 1)) * 100

    # for foodx
    today_food_log = FoodEntry.objects.filter(user=user,
                                              created_at__date=date.today(),
                                              is_active=True,
                                              is_quick_add=False)
    today_calorie_intake = sum([log.calories for log in today_food_log])

    yesterday_food_log = FoodEntry.objects.filter(user=user,
                                                  created_at__date=date.today() - timedelta(days=1),
                                                  is_active=True,
                                                  is_quick_add=False)

    yesterday_food_intake = sum([log.calories for log in yesterday_food_log])

    calorie_change_percentage = ((today_calorie_intake - yesterday_food_intake)
                                 / (yesterday_food_intake if yesterday_food_intake != 0 else 1)) * 100

    # for healthy foods
    today_healthy_food_count = sum([1 for log in today_food_log if log.health_rating == '3'])

    yesterday_healthy_food_count = sum([1
                                        for log in yesterday_food_log if log.health_rating == '3'])
    healthy_food_change_percentage = (((today_healthy_food_count - yesterday_healthy_food_count)
                                       / (yesterday_healthy_food_count if yesterday_healthy_food_count != 0 else 1))
                                      * 100)

    # for new stores
    today_new_store_count = sum([1 for log in today_food_log if log.purchased_from is not None
                                 and log.purchased_from.visits == 1])
    yesterday_new_store_count = sum([1 for log in yesterday_food_log if log.purchased_from is not None
                                     and log.purchased_from not in today_food_log and log.purchased_from.visits == 1])
    new_store_change_percentage = ((today_new_store_count - yesterday_new_store_count)
                                   / (yesterday_new_store_count if yesterday_new_store_count != 0 else 1)) * 100

    return Response({
        'today_water_intake': today_water_intake,
        'water_change_percentage': round(water_change_percentage),

        'today_calorie_intake': today_calorie_intake,
        'calorie_change_percentage': round(calorie_change_percentage),

        'today_healthy_food_count': today_healthy_food_count,
        'healthy_food_change_percentage': round(healthy_food_change_percentage),

        'today_new_store_count': today_new_store_count,
        'new_store_change_percentage': round(new_store_change_percentage)
    })


# returns data for middle left card of the dashboard
@api_view(['GET'])
def dashboard_top_foods(request, count: int):
    user = request.user

    # Get ALL food entries for the user
    all_foods = FoodEntry.objects.filter(
        user=user,
        is_active=True,
        is_quick_add=False
    )

    # Group by food_name
    food_groups = defaultdict(list)
    for food in all_foods:
        food_groups[food.food_name].append(food)

    # Build response with unique food_name entries
    response = []
    for i, (food_name, logs) in enumerate(food_groups.items(), start=1):
        response.append({
            'id': f"{i:02}",
            'name': food_name,
            'frequency': len(logs),
            'max_calorie': max(log.calories for log in logs),
            'min_calorie': min(log.calories for log in logs),
        })

    # Sort by frequency (descending) and take top `count`
    response.sort(key=lambda x: x['frequency'], reverse=True)
    top_response = response[:count]

    return Response(top_response)


# returns data for top right card of the dashboard
@api_view(['GET'])
def dashboard_top_stores(request, count):
    user = request.user

    top_n_stores = get_favourite_stores(user, count)
    popular_stores_count = sum(store.visits for store in top_n_stores)

    response = []

    for store in top_n_stores:
        response.append({
            'name': store.name,
            'address': store.address,
            'distance': store.distance,
            'visits': store.visits,
            'popularity': round((store.visits / popular_stores_count) * 100),
        })
    return Response(response)


# returns data for middle right card of the dashboard
@api_view(['GET'])
def weekly_comparison(request):
    user = request.user

    weekly_comparison = []
    this_week_data = []
    this_week_total = 0
    for i in range(6, -1, -1):
        this_date = date.today() - timedelta(days=i)
        logs = get_water_entries_from_date(user, this_date)
        total = sum([log.amount for log in logs])
        this_week_total += total
        this_week_data.append({'date': calendar.day_name[this_date.weekday()], 'total': total})

    weekly_comparison.append({'tag': 'This Week'})
    weekly_comparison.append({'data': this_week_data})
    weekly_comparison.append({'total': this_week_total})

    past_week_data = []
    past_week_total = 0
    for i in range(7):
        this_date = date.today() - timedelta(days=i + 7)
        logs = get_water_entries_from_date(user, this_date)
        total = sum([log.amount for log in logs])
        past_week_total += total
        past_week_data.append({'date': calendar.day_name[this_date.weekday()], 'total': total})

    weekly_comparison.append({'tag': 'Last Week'})
    weekly_comparison.append({'data': past_week_data})
    weekly_comparison.append({'total': past_week_total})

    return Response(weekly_comparison)


# returns data for bottom left card of the dashboard
@api_view(['GET'])
def today_water_intake_chart(request):
    user = request.user

    today_intake = sum([log.amount for log in get_water_entries_from_date(user, date.today())])
    same_day_last_week_intake = sum([log.amount for log in
                                     get_water_entries_from_date(user, date.today() - timedelta(days=7))])

    percentage_change = ((today_intake - same_day_last_week_intake) /
                         (same_day_last_week_intake if same_day_last_week_intake != 0 else 1)) * 100

    goal = Goal.objects.filter(user=user).first()
    return Response({
        'today_intake': today_intake,
        'same_day_last_week_intake': same_day_last_week_intake,
        'change': round(percentage_change),
        'goal': goal.water_goal if goal else 0
    })


# returns data for bottom right card of the dashboard
@api_view(['GET'])
def yearly_water_intake_chart(request):
    user = request.user

    month_data = []
    total_this_year = 0
    today = date.today()
    current_year = today.year
    current_month = today.month

    for i in range(11, -1, -1):
        # Calculate the year and month for the current iteration
        year = current_year - (current_month - 1 - i < 0)
        month = (current_month - 1 - i) % 12 + 1

        month_intake = sum([log.amount for log in get_water_entries_from_month(user, month, year)])
        month_name = calendar.month_name[month]
        month_data.append({'month': month_name, 'intake': month_intake})
        total_this_year += month_intake

    this_year_data = {
        'this_year_data': month_data,
        'total_this_year': total_this_year
    }

    return Response(this_year_data)


@api_view(['GET', 'POST', 'DELETE'])
def food_entries(request, date=None, entryId=None):
    if request.method == 'GET':
        # date contains the date in YYYY-MM-DD format
        entries = request.user.food_entries.filter(
            Q(created_at__date=date) & Q(is_active=True) & Q(is_quick_add=False))
        response = []

        for entry in entries:
            response.append({
                'id': entry.entry_id,
                'foodName': entry.food_name,
                'calories': entry.calories,
                'purchased': entry.purchased,
                'healthRating': entry.health_rating,
                'mealType': entry.meal_type,
                'notes': entry.notes,
                'protein': entry.protein,
                'carbs': entry.carbs,
                'fat': entry.fat,
                'store': entry.purchased_from.name if entry.purchased_from else None
            })
            print('Entry: ', response if entry.food_name == 'Burger' else None)
        return Response(response)

    elif request.method == 'POST':
        # no other parameters -  date and id are within the request
        data = request.data
        entry, entry_created = FoodEntry.objects.get_or_create(
            user=request.user, entry_id=data.get('id'), is_quick_add=False)

        entry.user = request.user

        entry.food_name = data.get('foodName')
        entry.calories = data.get('calories')
        entry.purchased = data.get('purchased')
        entry.health_rating = data.get('healthRating')
        entry.meal_type = data.get('mealType')
        entry.notes = data.get('notes')
        entry.protein = data.get('protein')
        entry.carbs = data.get('carbs')
        entry.fat = data.get('fat')
        entry.is_active = True

        if data.get('store'):
            store, store_created = Store.objects.get_or_create(user=request.user, name=data.get('store'))
            if store_created:
                address = Location.get_nearest_location(request.user.full_address, data.get('store'))
                store.name = data.get('store')
                store.visits = 1
                store.user = request.user
                store.address = address['address']
                store.distance = address['distance']
                store.save()
            else:
                store.visits += 1
                store.save()
            entry.purchased_from = store

        if entry_created:
            entry.frequency = 1
        else:
            entry.frequency += 1
            entry.created_at = timezone.now()

        entry.save()
        return Response({'success': True})

    elif request.method == 'DELETE':
        # entryId for deletion
        entry = request.user.food_entries.get(Q(entry_id__exact=entryId))
        if entry.purchased_from:
            entry.purchased_from.visits -= 1
            entry.purchased_from.save()
        entry.delete()
        return Response({'success': True})

    return Response({'success': False})


@api_view(['GET', 'POST', 'DELETE'])
def water_entries(request, date=None, entryId=None):
    if request.method == 'GET':
        print(date)
        entries = request.user.water_entries.filter(Q(created_at__date=date) & Q(is_active=True))
        response = []
        for entry in entries:
            response.append({
                'id': entry.entry_id,
                'amount': entry.amount,
                'timestamp': entry.created_at
            })
        return Response(response)
    elif request.method == 'POST':
        data = request.data
        WaterEntry.objects.create(
            user=request.user,
            amount=data.get('amount')
        )

        return Response({"success": True})
    elif request.method == 'DELETE':
        request.user.water_entries.get(entry_id=entryId).delete()
        return Response({"success": True})
    return Response({"success": False})


@api_view(['GET'])
def food_database(request):
    if request.method == 'GET':
        results = request.user.food_entries.all()
        response = []
        already_added = []
        for result in results:
            if result.food_name not in already_added:
                response.append({
                    'id': result.entry_id,
                    'name': result.food_name,
                    'calories': result.calories,
                    'purchased': result.purchased,
                    'healthRating': result.health_rating,
                    'mealType': result.meal_type,
                    'notes': result.notes,
                    'protein': result.protein,
                    'carbs': result.carbs,
                    'fat': result.fat,
                    'store': result.purchased_from.name if result.purchased_from else None
                })
                already_added.append(result.food_name)
        return Response(response)
    return Response({'success': False})


@api_view(['GET'])
def store_database(request):
    if request.method == 'GET':
        results = request.user.stores.all()
        response = []
        for result in results:
            response.append({
                'name': result.name,
            })

        return Response(response)
    return Response({'success': False})


@api_view(['GET', 'POST', 'DELETE'])
def quick_add_foods(request, itemId=None):
    if request.method == 'GET':

        entries = (request.user.food_entries.filter(Q(is_quick_add=True)).annotate(
            row_number=Window(
                expression=RowNumber(),
                partition_by=[F('food_name')],
                order_by=F('created_at').asc()  # change order_by if you prefer something else
            )
        ).filter(
            row_number=1
        ))

        response = []

        for entry in entries:
            response.append({
                'id': entry.entry_id,
                'foodName': entry.food_name,
                'calories': entry.calories,
                'healthRating': entry.health_rating,
                'mealType': entry.meal_type,
                'protein': entry.protein,
                'carbs': entry.carbs,
                'fat': entry.fat,
                'isDefault': entry.is_default,
                'isActive': entry.is_active,
            })
        return Response(response)

    elif request.method == 'POST':
        # no other parameters -  date and id are within the request
        data = request.data
        entry, created = FoodEntry.objects.get_or_create(user=request.user, entry_id=data.get('id'))
        entry.user = request.user

        entry.food_name = data.get('foodName')
        entry.calories = data.get('calories')
        entry.health_rating = data.get('healthRating')
        entry.meal_type = data.get('mealType')
        entry.protein = data.get('protein')
        entry.carbs = data.get('carbs')
        entry.fat = data.get('fat')
        entry.is_default = data.get('isDefault') if data.get('isDefault') else False
        entry.is_active = data.get('isActive') if data.get('isActive') is not None else True
        entry.is_quick_add = True

        entry.save()

        if entry.is_default:
            defaults = request.user.user_profile.default_foods.split(", ")

            if entry.food_name in defaults:
                defaults.remove(entry.food_name)
            else:
                defaults.append(entry.food_name)
            request.user.user_profile.default_foods = ", ".join(defaults)
            request.user.user_profile.save()

        return Response({'success': True})

    elif request.method == 'DELETE':
        # entryId for deletion
        entry = request.user.food_entries.get(entry_id=itemId)
        entry.is_active = False

        entry.save()
        return Response({'success': True})

    return Response({'success': False})


@api_view(['GET', 'POST', 'DELETE'])
def water_containers(request, containerId=None):
    if request.method == 'GET':
        containers = request.user.water_containers.all()
        response = []
        for container in containers:
            response.append({
                'id': container.container_id,
                'amount': container.amount,
                'label': container.label,
                'icon': container.icon,
                'isActive': container.is_active,
                'isDefault': container.is_default,
            })
        print('Response from python: ', len(response))
        return Response(response)

    elif request.method == 'POST':
        data = request.data
        container, created = WaterContainer.objects.get_or_create(
            user=request.user, label=data.get('label'), icon=data.get('icon')
        )

        container.container_id = data.get('id') if data.get('id') else str(uuid.uuid4())
        container.amount = data.get('amount')
        container.label = data.get('label')
        container.icon = data.get('icon')
        container.is_active = data.get('isActive') if data.get('isActive') is not None else True
        container.is_default = data.get('isDefault') if data.get('isDefault') else False

        container.save()

        return Response({'success': True})

    elif request.method == 'DELETE':
        container = request.user.water_containers.get(container_id=containerId)
        container.is_active = False
        container.save()
        return Response({'success': True})
    return Response({"success": False})


@api_view(['GET'])
def weekly_data(request, daysBack):
    daysBack = int(daysBack)
    if request.method == 'GET':
        result = []
        today = date.today()
        for i in range(daysBack - 1, -1, -1):
            loop_date = today - timedelta(days=i)
            dateKey = loop_date.strftime('%Y-%m-%d')
            entries = request.user.food_entries.filter(Q(created_at__date=loop_date))
            entry_result = []
            for entry in entries:
                entry_result.append({
                    'id': entry.entry_id,
                    'foodName': entry.food_name,
                    'calories': entry.calories,
                    'purchased': entry.purchased,
                    'healthRating': entry.health_rating,
                    'mealType': entry.meal_type,
                    'notes': entry.notes,
                    'protein': entry.protein,
                    'carbs': entry.carbs,
                    'fat': entry.fat,
                    'store': entry.purchased_from.name if entry.purchased_from else None,
                    'createdAt': entry.created_at.strftime('%A'),
                })

            result.append({
                'date': dateKey,
                'displayDate': loop_date.strftime('%b %d'),
                'entries': entry_result
            })
        return Response(result)

    return Response({"success": False})


@api_view(['GET', 'POST'])
def goals(request):
    if request.method == 'GET':
        goal = Goal.objects.filter(user=request.user)
        if goal.exists():
            goal = goal.first()
            goal_response = {
                'waterGoal': goal.water_goal,
                'calorieGoal': goal.calorie_goal,
                'proteinGoal': goal.protein_goal,
                'carbsGoal': goal.carbs_goal,
                'fatGoal': goal.fat_goal,
            }

            return Response(goal_response)

    elif request.method == 'POST':
        data = request.data
        goal = Goal.objects.filter(user=request.user)
        if goal.exists():
            goal = goal.first()
            goal.water_goal = data.get('waterGoal')
            goal.calorie_goal = data.get('calorieGoal')
            goal.protein_goal = data.get('proteinGoal')
            goal.carbs_goal = data.get('carbsGoal')
            goal.fat_goal = data.get('fatGoal')
            goal.save()

        return Response({"success": True})

    return Response({"success": False})


@api_view(['GET', 'POST'])
def settings(request):
    if request.method == 'GET':
        settings_response = {}
        profile = Profile.objects.filter(user=request.user)
        if profile.exists():
            profile = profile.first()
            settings_response = {
                'streak': profile.streak,
            }

        return Response(settings_response)

    elif request.method == 'POST':
        data = request.data
        profile = Profile.objects.filter(user=request.user)
        if profile.exists():
            profile = profile.first()
            profile.streak = data.get('streak')
            profile.save()

            return Response({"success": True})

    return Response({"success": False})


@api_view(['GET'])
def clear_data(request):
    if request.method == 'GET':
        # Delete all existing entries

        WaterEntry.objects.filter(user=request.user).delete()
        WaterEntry.objects.filter(user=request.user).delete()
        FoodEntry.objects.filter(user=request.user).delete()
        Store.objects.filter(user=request.user).delete()
        Profile.objects.filter(user=request.user).delete()
        Goal.objects.filter(user=request.user).delete()
        WaterContainer.objects.filter(user=request.user).delete()
        request.user.delete()

        return Response({"success": True})
    return Response({"success": False})


@api_view(['GET'])
def export_data_to_json(request):
    """
    Exports data from User, Profile, WaterEntry, FoodEntry,
    Store, Goal, and WaterContainer models to a JSON serializable dictionary,
    mapping fields individually.
    """
    data = {
        'user': [],
        'profile': [],
        'water_entries': [],
        'food_entries': [],
        'stores': [],
        'goals': [],
        'water_containers': [],
    }

    user = User.objects.get(id=request.user.id)

    # Export User
    user_data = {
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'username': user.username,
        'phone': user.phone,
        'dob': user.dob.strftime('%A, %B %d, %Y') if user.dob else None,  # handle date
        'created_at': user.created_at.strftime('%A, %B %d, %Y %I:%M %p'),
    }
    data['user'].append(user_data)

    # Export Profile
    if hasattr(user, 'user_profile'):  # Check if the user has a profile.
        profile = user.user_profile
        profile_data = {
            'primary_goal': profile.primary_goal,
            'current_diet': profile.current_diet,
            'snacking': profile.snacking,
            'beverages': profile.beverages,
            'water_intake': profile.water_intake,
            'dietary_restrictions': profile.dietary_restrictions,
            'exercise': profile.exercise,
            'usual_store': profile.usual_store,
            'default_foods': profile.default_foods,
            'default_water_containers': profile.default_water_containers,
            'streak': profile.streak,
            'created_at': profile.created_at.strftime('%A, %B %d, %Y %I:%M %p'),
        }
        data['profile'].append(profile_data)
    else:
        data['profile'].append(None)  # Append None if user doesn't have a profile

    # Export Water Entries
    for entry in user.water_entries.all():
        entry_data = {
            'amount': entry.amount,
            'created_at': entry.created_at.strftime('%A, %B %d, %Y %I:%M %p'),
        }
        data['water_entries'].append(entry_data)

    # Export Food Entries
    for entry in user.food_entries.filter(is_default=False, is_quick_add=False).all():
        entry_data = {
            'food_name': entry.food_name,
            'calories': entry.calories,
            'purchased': entry.purchased,
            'purchased_from': entry.purchased_from.name if entry.purchased_from else None,
            'health_rating': entry.health_rating,
            'meal_type': entry.meal_type,
            'notes': entry.notes,
            'protein': entry.protein,
            'carbs': entry.carbs,
            'fat': entry.fat,
            'frequency': entry.frequency,
            'created_at': entry.created_at.strftime('%A, %B %d, %Y %I:%M %p'),
        }
        data['food_entries'].append(entry_data)

    # Export Stores
    for store in user.stores.all():
        store_data = {
            'name': store.name,
            'address': store.address,
            'visits': store.visits,
            'created_at': store.created_at.strftime('%A, %B %d, %Y %I:%M %p'),
        }
        data['stores'].append(store_data)

    # Export Goals
    if hasattr(user, 'goal'):
        goal = user.goal
        goal_data = {
            'calorie_goal': goal.calorie_goal,
            'water_goal': goal.water_goal,
            'protein_goal': goal.protein_goal,
            'carbs_goal': goal.carbs_goal,
            'fat_goal': goal.fat_goal,
            'created_at': goal.created_at.strftime('%A, %B %d, %Y %I:%M %p'),
        }
        data['goals'].append(goal_data)
    else:
        data['goals'].append(None)

    # Export Water Containers
    for container in user.water_containers.filter(is_default=False).all():
        container_data = {
            'amount': container.amount,
            'label': container.label,
            'created_at': container.created_at.strftime('%A, %B %d, %Y %I:%M %p'),
        }
        data['water_containers'].append(container_data)

    return Response(data)


@api_view(['POST'])
def import_data_from_json(request):
    json_data = request.data
    user = request.user

    # Delete existing data
    WaterEntry.objects.filter(user=request.user).delete()
    WaterEntry.objects.filter(user=request.user).delete()
    FoodEntry.objects.filter(user=request.user, is_default=False).delete()
    Store.objects.filter(user=request.user).delete()
    Profile.objects.filter(user=request.user).delete()
    Goal.objects.filter(user=request.user).delete()
    WaterContainer.objects.filter(user=request.user, is_default=False).delete()

    # Import Profiles
    for profile_data in json_data.get('profile', []):
        profile = Profile(user=user)
        for key, value in profile_data.items():
            if key == 'created_at':
                try:
                    profile.created_at = datetime.strptime(value, '%A, %B %d, %Y %I:%M %p')
                except (ValueError, TypeError):
                    print(f"Warning: Could not parse 'created_at' value: {value} for Profile.")
            elif hasattr(profile, key) and key != 'id':
                setattr(profile, key, value)
        profile.save()

    # Import Stores
    for store_data in json_data.get('stores', []):
        store = Store(user=user)
        for key, value in store_data.items():
            if key == 'created_at':
                try:
                    store.created_at = datetime.strptime(value, '%A, %B %d, %Y %I:%M %p')
                except (ValueError, TypeError):
                    print(f"Warning: Could not parse 'created_at' value: {value} for Store.")
            elif hasattr(store, key) and key != 'id':
                setattr(store, key, value)
        store.save()

    # Import Water Entries
    for entry_data in json_data.get('water_entries', []):
        water_entry = WaterEntry(user=user)
        for key, value in entry_data.items():
            if key == 'created_at':
                try:
                    water_entry.created_at = datetime.strptime(value, '%A, %B %d, %Y %I:%M %p')
                except (ValueError, TypeError):
                    print(f"Warning: Could not parse 'created_at' value: {value} for WaterEntry.")
            elif hasattr(water_entry, key) and key != 'id':
                setattr(water_entry, key, value)
        water_entry.save()

    # Import Food Entries
    for entry_data in json_data.get('food_entries', []):
        food_entry = FoodEntry(user=user)
        purchased_from_name = entry_data.pop('purchased_from', None)
        if purchased_from_name:
            try:
                store = Store.objects.get(user=user, name=purchased_from_name)
                food_entry.purchased_from = store
            except ObjectDoesNotExist:
                print(f"Warning: Store with name '{purchased_from_name}' "
                      f"not found for user, skipping purchased_from for FoodEntry.")
            except Exception as e:
                print(f"Error while finding store for FoodEntry: {e}")

        for key, value in entry_data.items():
            if key == 'created_at':
                try:
                    food_entry.created_at = datetime.strptime(value, '%A, %B %d, %Y %I:%M %p')
                except (ValueError, TypeError):
                    print(f"Warning: Could not parse 'created_at' value: {value} for FoodEntry.")
            elif hasattr(food_entry, key) and key != 'id':
                setattr(food_entry, key, value)
        food_entry.save()

    # Import Goals
    for goal_data in json_data.get('goals', []):
        goal = Goal(user=user)
        for key, value in goal_data.items():
            if key == 'created_at':
                try:
                    goal.created_at = datetime.strptime(value, '%A, %B %d, %Y %I:%M %p')
                except (ValueError, TypeError):
                    print(f"Warning: Could not parse 'created_at' value: {value} for Goal.")
            elif hasattr(goal, key) and key != 'id':
                setattr(goal, key, value)
        goal.save()

    # Import Water Containers
    for container_data in json_data.get('water_containers', []):
        water_container = WaterContainer(user=user)
        for key, value in container_data.items():
            if key == 'created_at':
                try:
                    water_container.created_at = datetime.strptime(value, '%A, %B %d, %Y %I:%M %p')
                except (ValueError, TypeError):
                    print(f"Warning: Could not parse 'created_at' value: {value} for WaterContainer.")
            if hasattr(water_container, key) and key != 'id':
                setattr(water_container, key, value)
        water_container.save()

    return Response({"success": True})


def exported_data(request):
    return render(request, 'core/json.html')
