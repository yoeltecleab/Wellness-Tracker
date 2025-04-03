from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import render, redirect

from core.forms import MyUserCreationForm
from core.models import User, Profile
from .models import FoodEntry
from .utils import CreateDemoUser


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


def generate_demo_user(request):
    CreateDemoUser.run()
    return HttpResponse("Demo user created successfully.")
