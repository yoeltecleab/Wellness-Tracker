from dbm.sqlite3 import error

from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect

from core.forms import MyUserCreationForm
from core.models import User, Profile


# Create your views here.

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

    if request.method == 'POST':
        try:
            user = request.user
            user.first_name = request.POST['first-name']
            user.last_name = request.POST['last-name']
            user.phone = request.POST['phone']
            user.dob = request.POST['dob']

            profile = Profile()
            profile.primary_goal = request.POST['primary-goal']
            profile.current_diet = request.POST['current-diet']
            profile.snack_between_meals = request.POST['snacking']
            profile.beverages = ", ".join(request.POST.getlist('beverages'))
            profile.current_water_intake = request.POST['water-intake']
            profile.diet_restrictions = ", ".join(request.POST.getlist('dietary-restrictions'))
            profile.exercise = request.POST['exercise']
            profile.usual_store = request.POST['usual-store']
            profile.weight_goal = request.POST['weight-goal']
            profile.calorie_goal = request.POST['calorie-goal']

            user.profile = profile
            profile.save()
            user.save()
            return redirect('dashboard')
        except Exception as e:
            print(e)
            messages.error(request, "Please fill all fields")
            return redirect('onboarding_quiz')

    return render(request, 'core/onboarding_quiz.html')


def register_user(request):
    form = MyUserCreationForm(request.POST)
    if form.is_valid():
        user = form.save(commit=False)
        user.email = user.email.lower()
        user.save()
        return redirect('onboarding_quiz')
    context = {
        'form': form,
        'page': 'signup'
    }
    return render(request, 'core/signup.html', context)


def login_user(request):
    email = request.POST['email'].lower()
    user = None
    try:
        user = User.objects.get(email=email)
    except [error, User.DoesNotExist]:
        messages.error(request, "User does not exist")

    if user.profile is None:
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
    return render(request, 'core/food_logging.html')