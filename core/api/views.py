import calendar
from datetime import date, timedelta

from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import User

MULTIPLIER = 0.314159265358979


def get_favourite_foods(user: User, count):
    return user.foods.order_by('-frequency')[:count]


def get_favourite_stores(user: User, count):
    return user.stores.order_by('-visits')[:count]


def get_water_logs_from_date(user: User, date):
    return user.water_logs.filter(created_at__date=date)


def get_water_logs_from_month(user: User, month, year):
    return user.water_logs.filter(Q(created_at__month=month) & Q(created_at__year=year))


def get_food_logs_from_date(user: User, date):
    return user.food_logs.filter(created_at__date=date)


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
    today_food_log = get_food_logs_from_date(user, date.today())
    today_calorie_intake = sum([log.calories for log in today_food_log])

    yesterday_food_log = get_food_logs_from_date(user, date.today() - timedelta(days=1))
    yesterday_food_intake = sum([log.calories for log in yesterday_food_log])

    calorie_change_percentage = ((today_calorie_intake - yesterday_food_intake)
                                 / (yesterday_food_intake if yesterday_food_intake != 0 else 1)) * 100

    # for healthy foods
    today_healthy_food_count = sum([1 for log in today_food_log if log.is_healthy])
    yesterday_healthy_food_count = sum([1 for log in yesterday_food_log if log.is_healthy])
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

    top_n_foods = get_favourite_foods(user, count)
    popular_food_count = sum(food.frequency for food in top_n_foods) * MULTIPLIER

    response = []
    i = 1
    for food in top_n_foods:
        response.append({
            'id': "0" + str(i) if i < 10 else str(i),
            'name': food.name,
            'frequency': food.frequency,
            'max_calorie': max(log.calories for log in food.food_logs.all()),
            'min_calorie': min(log.calories for log in food.food_logs.all()),
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

    goal = user.user_profile.water_goal
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
