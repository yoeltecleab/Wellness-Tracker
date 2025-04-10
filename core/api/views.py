import calendar
import uuid
from datetime import date, timedelta

from django.db.models import Q, Window, F
from django.db.models.functions import RowNumber
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import User, FoodEntry, Store

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
    return user.food_entries.order_by('-frequency')[:count]


def get_favourite_stores(user: User, count):
    return user.stores.filter(visits__gt=0).order_by('-visits')[:count]


def get_water_logs_from_date(user: User, date):
    return user.water_logs.filter(created_at__date=date)


def get_water_logs_from_month(user: User, month, year):
    return user.water_logs.filter(Q(created_at__month=month) & Q(created_at__year=year))


def get_food_entries_from_date(user: User, date):
    return user.food_entries.filter(Q(created_at__date=date) & Q(is_active=True))


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
                              get_water_logs_from_date(user, date.today())])
    yesterday_water_intake = sum([log.amount for log in
                                  get_water_logs_from_date(user, date.today() - timedelta(days=1))])

    water_change_percentage = ((today_water_intake - yesterday_water_intake) /
                               (yesterday_water_intake if yesterday_water_intake != 0 else 1)) * 100

    # for foodx
    today_food_log = get_food_entries_from_date(user, date.today())
    today_calorie_intake = sum([log.calories for log in today_food_log])

    yesterday_food_log = get_food_entries_from_date(user, date.today() - timedelta(days=1))
    yesterday_food_intake = sum([log.calories for log in yesterday_food_log])

    calorie_change_percentage = ((today_calorie_intake - yesterday_food_intake)
                                 / (yesterday_food_intake if yesterday_food_intake != 0 else 1)) * 100

    # for healthy foods
    today_healthy_food_count = sum([1 for log in today_food_log if log.health_rating in ['Excellent', 'Good']])
    yesterday_healthy_food_count = sum([1 for log in yesterday_food_log if log.health_rating in ['Excellent', 'Good']])
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

    top_n_foods = user.food_entries.filter(is_active=True, is_quick_add=False).order_by('-frequency')[:count]

    response = []
    i = 1
    for food in top_n_foods:
        response.append({
            'id': "0" + str(i) if i < 10 else str(i),
            'name': food.food_name,
            'frequency': food.frequency,
            'max_calorie': max(log.calories for log in top_n_foods),
            'min_calorie': min(log.calories for log in top_n_foods),
        })
        i += 1

    return Response(response)


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
        logs = get_water_logs_from_date(user, this_date)
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
        logs = get_water_logs_from_date(user, this_date)
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

    today_intake = sum([log.amount for log in get_water_logs_from_date(user, date.today())])
    same_day_last_week_intake = sum([log.amount for log in
                                     get_water_logs_from_date(user, date.today() - timedelta(days=7))])

    percentage_change = ((today_intake - same_day_last_week_intake) /
                         (same_day_last_week_intake if same_day_last_week_intake != 0 else 1)) * 100

    goal = user.goal.water_goal
    return Response({
        'today_intake': today_intake,
        'same_day_last_week_intake': same_day_last_week_intake,
        'change': round(percentage_change),
        'goal': goal
    })


# returns data for bottom right card of the dashboard
@api_view(['GET'])
def yearly_water_intake_chart(request):
    user = request.user

    month_data = []
    total_this_year = 0
    for i in range(11, -1, -1):
        this_month = (date.today().month - i) % 12
        this_year = date.today().year

        if this_month == 0:
            this_year -= 1
            this_month = 12

        month_intake = sum([log.amount for log in get_water_logs_from_month(user, this_month, this_year)])
        month_name = calendar.month_name[this_month]
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
        return Response(response)

    elif request.method == 'POST':
        # no other parameters -  date and id are within the request
        data = request.data
        entry, entry_created = FoodEntry.objects.get_or_create(
            user=request.user, entry_id=data.get('id'), is_quick_add=False)
        store, store_created = Store.objects.get_or_create(user=request.user, name=data.get('store'))
        entry.user = request.user

        entry.entry_id = data.get('id') if data.get('id') else str(uuid.uuid4())
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

        if store_created:
            store.name = data.get('store')
            store.visits = 1
            store.user = request.user
            store.address = '123 Main St New York, NY 10001'
            store.save()
        else:
            store.visits += 1
            store.save()

        if entry_created:
            entry.frequency = 1
        else:
            entry.frequency += 1

        entry.purchased_from = store
        entry.save()
        return Response({'success': True})

    elif request.method == 'DELETE':
        # entryId for deletion
        entry = request.user.food_entries.get(Q(entry_id__exact=entryId) & Q(is_active=True))
        if entry.purchased_from:
            entry.purchased_from.visits -= 1
        entry.is_active = False
        entry.save()
        return Response({'success': True})

    return Response({'success': False})


@api_view(['GET', 'POST', 'DELETE'])
def water_entries(request, date, entryId):
    if request.method == 'GET':
        # date contains the date in YYYY-MM-DD format
        print("")

    elif request.method == 'POST':
        # no other parameters -  date and id are within the request
        print("")

    elif request.method == 'DELETE':
        # entryId for deletion
        print("")
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
                    'foodName': result.food_name,
                    'calories': result.calories,
                    'purchased': result.purchased,
                    'healthRating': switchHealthRatingToNumbers(result.health_rating),
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
        print("Response on python ", len(response))
        return Response(response)

    elif request.method == 'POST':
        # no other parameters -  date and id are within the request
        data = request.data
        entry, created = FoodEntry.objects.get_or_create(user=request.user, entry_id=data.get('id'))
        entry.user = request.user

        entry.entry_id = data.get('id') if data.get('id') else str(uuid.uuid4())
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
        return Response({'success': True})

    elif request.method == 'DELETE':
        # entryId for deletion
        entry = request.user.food_entries.get(entry_id=itemId)
        entry.is_active = False
        entry.save()
        return Response({'success': True})

    return Response({'success': False})


@api_view(['GET', 'POST', 'DELETE'])
def water_containers(request, containerId):
    if request.method == 'GET':
        # no parameters
        print("")

    elif request.method == 'POST':
        # no parameters
        print("")

    elif request.method == 'DELETE':
        # containerId for deletion
        print("")
    return Response({"success": False})


@api_view(['GET', 'POST'])
def settings(request, key):
    if request.method == 'GET':
        # get the settings using the key
        print("")

    elif request.method == 'POST':
        # no parameters - info is in the request
        print("")

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
                    'store': entry.purchased_from.name if entry.purchased_from else None
                })

            result.append({
                'date': dateKey,
                'displayDate': loop_date.strftime('%b %d'),
                'entries': entry_result
            })
        return Response(result)

    return Response({"success": False})


@api_view(['GET'])
def goals(request):
    if request.method == 'GET':
        goal = request.user.goal

        return Response({
            'waterGoal': goal.water_goal,
            'calorieGoal': goal.calorie_goal,
            'proteinGoal': goal.protein_goal,
            'carbsGoal': goal.carbs_goal,
            'fatGoal': goal.fat_goal
        })

    return Response({"success": False})