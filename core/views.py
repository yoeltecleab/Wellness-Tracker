import calendar
from datetime import date, timedelta

from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import render, redirect

from core.forms import MyUserCreationForm
from core.models import User, Profile
from .models import FoodEntry
from .util import CreateDemoUser


# Create your views here.

def auth(username=None, password=None):
    try:
        user = User.objects.get(Q(username__iexact=username) | Q(email__iexact=username))
    except User.DoesNotExist:
        return None
    if user.check_password(password):
        return user
    return None


def sign_up(request):
    form = MyUserCreationForm()

    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        return register_user(request)

    context = {
        'form': form,
        'page': 'signup'
    }

    return render(request, 'core/signup.html', context)


def sign_in(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        return login_user(request)

    context = {
        'page': 'signin'
    }

    return render(request, 'core/signup.html', context)


@login_required(login_url='signin')
def dashboard(request):
    return render(request, 'core/dashboard.html')


def index(request):
    return render(request, 'core/index.html')


@login_required(login_url='signin')
def water_logging(request):
    return render(request, 'core/water_logging.html')


@login_required(login_url='signin')
def onboarding_quiz(request):
    context = {
        'source': 'onboarding'
    }
    return profile_helper(request, context, 'onboarding_quiz')


def register_user(request):
    form = MyUserCreationForm(request.POST)
    if form.is_valid():
        user = form.save(commit=False)
        user.email = user.email.lower()
        user.save()
        login(request, user)
        return redirect('onboarding_quiz')
    context = {
        'form': form,
        'page': 'signup'
    }
    return render(request, 'core/signup.html', context)


def login_user(request):
    email = request.POST['email'].lower()
    password = request.POST['password']
    user = None
    try:
        user = auth(email, password)
    except BaseException as error:
        messages.error(request, error)

    if user is None:
        messages.error(request, 'Invalid email or password')
        return redirect('signin')

    if user.user_profile is None:
        login(request, user)
        return redirect('onboarding_quiz')
    else:
        login(request, user)
        return redirect('dashboard')


def signout(request):
    logout(request)
    return redirect('index')


@login_required(login_url='signin')
def food_logging(request):
    if request.method == 'POST':
        food_name = request.POST.get('food_name')
        calories = request.POST.get('calories')

        if food_name and calories:
            FoodEntry.objects.create(user=request.user, food_name=food_name, calories=calories)

        return redirect('food_logging')

    food_entries = FoodEntry.objects.filter(user=request.user).order_by('-date_added')
    return render(request, 'core/food_logging.html', {'food_entries': food_entries})


def update_profile(request):
    form = MyUserCreationForm(instance=request.user)
    context = {
        'form': form,
        'source': 'update'
    }
    if form.is_valid():
        form.save(commit=False)
    return profile_helper(request, context, 'update_profile')


def profile_helper(request, context, this_page):
    if request.method == 'POST':
        try:
            user = request.user

            if this_page == 'update_profile':
                user.email = request.POST['email'].lower()
                user.set_password(request.POST['password1'])

            user.first_name = request.POST['first-name']
            user.last_name = request.POST['last-name']
            user.username = request.POST['username']
            user.phone = request.POST['phone']
            user.dob = request.POST['dob']

            profile, _ = Profile.objects.get_or_create(user=user)

            profile.primary_goal = request.POST['primary-goal']
            profile.current_diet = request.POST['current-diet']
            profile.snacking = request.POST['snacking']
            profile.beverages = ", ".join(request.POST.getlist('beverages'))
            profile.water_intake = request.POST['water-intake']
            profile.dietary_restrictions = ", ".join(request.POST.getlist('dietary-restrictions'))
            profile.exercise = request.POST['exercise']
            profile.usual_store = request.POST['usual-store']
            profile.water_goal = request.POST['water-goal']
            profile.calorie_goal = request.POST['calorie-goal']

            profile.user = user
            user.save()
            profile.save()
            login(request, user)
            return redirect('dashboard')
        except Exception as e:
            print(e)
            messages.error(request, "Please fill all fields")
            return redirect(this_page)

    return render(request, 'core/onboarding_quiz.html', context)


def get_favourite_foods(user: User, count):
    return user.foods.order_by('frequency')[:count]


def get_favourite_stores(user: User, count):
    return user.stores.order_by('visits')[:count]


def get_water_logs_from_date(user: User, date):
    return user.water_logs.filter(created_at__date=date)


def get_water_logs_from_month(user: User, month):
    return user.water_logs.filter(created_at__month=month)


def get_water_logs_from_date_range(user: User, start_date, end_date):
    return user.water_logs.filter(created_at__range=(start_date, end_date))


def get_food_logs_from_date(user: User, date):
    return user.food_logs.filter(created_at__date=date)


def get_food_logs_from_date_range(user: User, start_date, end_date):
    return user.food_logs.filter(created_at__range=(start_date, end_date))


# returns data for top left card of the dashboard
def dashboard_data_todays_intake(user: User):
    # for water
    today_water_intake = sum([log.amount for log in
                              get_water_logs_from_date(user, date.today())])
    yesterday_water_intake = sum([log.amount for log in
                                  get_water_logs_from_date(user, date.today() - timedelta(days=1))])
    water_change_percentage = ((today_water_intake - yesterday_water_intake) / yesterday_water_intake) * 100

    # for food
    today_food_log = get_food_logs_from_date(user, date.today())
    today_calorie_intake = sum([log.food.calories for log in today_food_log])

    yesterday_food_log = get_food_logs_from_date(user, date.today() - timedelta(days=1))
    yesterday_food_intake = sum([log.food.calories for log in yesterday_food_log])

    calorie_change_percentage = ((today_calorie_intake - yesterday_food_intake) / yesterday_food_intake) * 100

    # for healthy foods
    today_healthy_food_count = sum([1 for log in today_food_log if log.food.is_healthy])
    yesterday_healthy_food_count = sum([1 for log in yesterday_food_log if log.food.is_healthy])
    healthy_food_change_percentage = ((today_healthy_food_count - yesterday_healthy_food_count)
                                      / yesterday_healthy_food_count) * 100

    # for new stores
    today_new_store_count = sum([1 for log in today_food_log if log.purchased_from is not None
                                 and log.purchased_from.visits == 1])
    yesterday_new_store_count = sum([1 for log in yesterday_food_log if log.purchased_from is not None
                                     and log.purchased_from not in today_food_log and log.purchased_from.visits == 1])
    new_store_change_percentage = ((today_new_store_count - yesterday_new_store_count)
                                   / yesterday_new_store_count) * 100

    return {
        'today_water_intake': today_water_intake,
        'water_change_percentage': water_change_percentage,

        'today_calorie_intake': today_calorie_intake,
        'calorie_change_percentage': calorie_change_percentage,

        'today_healthy_food_count': today_healthy_food_count,
        'healthy_food_change_percentage': healthy_food_change_percentage,

        'today_new_store_count': today_new_store_count,
        'new_store_change_percentage': new_store_change_percentage
    }


# returns data for middle left card of the dashboard
def dashboard_top_foods(user: User, count):
    top_n_foods = get_favourite_foods(user, count)

    return {
        'top_n_foods': top_n_foods
    }


# returns data for top right card of the dashboard
def dashboard_top_stores(user: User, count):
    top_n_stores = get_favourite_stores(user, count)

    return {
        'top_n_stores': top_n_stores
    }


# returns data for middle right card of the dashboard
def weekly_comparison(user: User):
    this_end_date = date.today()
    this_start_date = this_end_date - timedelta(days=6)
    this_logs = get_water_logs_from_date_range(user, this_start_date, this_end_date)
    this_total = sum([log.amount for log in this_logs])

    past_end_date = this_start_date - timedelta(days=1)
    past_start_date = past_end_date - timedelta(days=6)
    past_logs = get_water_logs_from_date_range(user, past_start_date, past_end_date)
    past_total = sum([log.amount for log in past_logs])

    return {
        'this_week_logs': this_logs,
        'this_week_total': this_total,
        'past_week_logs': past_logs,
        'past_week_total': past_total
    }


# returns data for bottom left card of the dashboard
def today_water_intake_chart(user: User):
    today_intake = sum([log.amount for log in get_water_logs_from_date(user, date.today())])
    same_day_last_week_intake = sum([log.amount for log in
                                     get_water_logs_from_date(user, date.today() - timedelta(days=6))])
    goal = user.user_profile.water_goal
    return {
        'today_intake': today_intake,
        'same_day_last_week_intake': same_day_last_week_intake,
        'goal': goal
    }


# returns data for bottom right card of the dashboard
def yearly_water_intake_chart(user: User):
    month_data = []
    for i in range(12):
        this_month = date.today().month - i
        month_intake = sum([log.amount for log in get_water_logs_from_month(user, this_month)])
        month_name = calendar.month_name[this_month]
        month_data.append({'month': month_name, 'intake': month_intake})

    return {
        'month_data': month_data
    }


def generate_demo_user(request):
    CreateDemoUser.run()
    return HttpResponse("Demo user created successfully.")