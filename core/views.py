from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import render, redirect

from core.forms import MyUserCreationForm
from core.models import User, Profile, Goal, WaterContainer, Store, LocationAddress
from .api.location import Location
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

    context = {'form': form, 'page': 'signup'}

    return render(request, 'core/signup.html', context)


def sign_in(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        return login_user(request)

    context = {'page': 'signin'}

    return render(request, 'core/signup.html', context)


@login_required(login_url='signin')
def dashboard(request):
    profile = Profile.objects.filter(user=request.user).first()
    if profile is None:
        login(request, request.user)
        return redirect('onboarding_quiz')
    return render(request, 'core/dashboard.html')


def index(request):
    return render(request, 'core/index.html')


@login_required(login_url='signin')
def water_logging(request):
    profile = Profile.objects.filter(user=request.user).first()
    if profile is None:
        login(request, request.user)
        return redirect('onboarding_quiz')
    context = {'source': 'water'}
    return render(request, 'core/logging.html', context)


@login_required(login_url='signin')
def onboarding_quiz(request):
    context = {'source': 'onboarding'}
    return profile_helper(request, context, 'onboarding_quiz')

@login_required(login_url='signin')
def storePage(request):
    context = {'source': 'store'}
    return render(request, 'core/storePage.html', context)

def register_user(request):
    form = MyUserCreationForm(request.POST)
    if form.is_valid():
        user = form.save(commit=False)
        user.email = user.email.lower()
        user.save()
        create_default_items(user, [])
        login(request, user)
        return redirect('onboarding_quiz')
    context = {'form': form, 'page': 'signup'}
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

    profile = Profile.objects.filter(user=request.user).first()
    if profile is None:
        login(request, request.user)
        return redirect('onboarding_quiz')

    context = {'source': 'food'}

    if request.method == 'POST':
        food_name = request.POST.get('food_name')
        calories = request.POST.get('calories')

        if food_name and calories:
            FoodEntry.objects.create(user=request.user, food_name=food_name, calories=calories)

        return redirect('food_logging', context)

    return render(request, 'core/logging.html', context)


def update_profile(request):
    form = MyUserCreationForm(instance=request.user)
    context = {'form': form, 'source': 'update'}
    if form.is_valid():
        form.save(commit=False)
    return profile_helper(request, context, 'update_profile')


def update_store_locations(user, request_address):
    for store in Store.objects.filter(user=user):
        address = Location.get_nearest_location(request_address, store.name)
        store.address = address['address']
        store.distance = address['distance']
        store.save()


def create_address(request, user):
    address, _ = LocationAddress.objects.get_or_create(user=user)
    address.addressLine1 = request.POST['addressLine1']
    address.addressLine2 = request.POST['addressLine2']
    address.city = request.POST['city']
    address.state = request.POST['state']
    address.zipcode = request.POST['zipcode']
    address.save()

    user.full_address = (f"{address.addressLine1}, "
                         f"{address.city}, {address.state}")


def profile_helper(request, context, this_page):
    if request.method == 'POST':
        try:
            user = request.user
            old_address = user.full_address
            request_address = f"{request.POST['addressLine1']}, {request.POST['city']}, {request.POST['state']}"

            if this_page == 'update_profile':
                user.email = request.POST['email'].lower()
                user.set_password(request.POST['password1'])
                if request_address != old_address:
                    user.full_address = request_address
                    update_store_locations(user, request_address)

            create_user(request, user)
            create_address(request, user)

            create_profile(request, user)
            create_default_items(user, request.POST.getlist('default-foods'))

            # Create or update goal
            create_goal(request, user)

            user.save()
            login(request, user)
            return redirect('dashboard')

        except Exception as e:
            print(e)
            messages.error(request, "Please fill all fields")
            return redirect(this_page)

    return render(request, 'core/onboarding_quiz.html', context)


def create_user(request, user):
    user.first_name = request.POST['first-name']
    user.last_name = request.POST['last-name']
    user.username = request.POST['username']
    user.phone = request.POST['phone']
    user.dob = request.POST['dob']


def create_goal(request, user):
    goal, created = Goal.objects.get_or_create(user=user)
    goal.water_goal = request.POST['water-goal']
    goal.calorie_goal = request.POST['calorie-goal']
    goal.protein_goal = request.POST['protein-goal']
    goal.carbs_goal = request.POST['carbs-goal']
    goal.fat_goal = request.POST['fat-goal']
    goal.save()


def create_profile(request, user):
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
    profile.default_foods = ", ".join(request.POST.getlist('default-foods'))
    profile.save()


def generate_demo_user(request):
    CreateDemoUser.run()
    return HttpResponse("Demo user created successfully.")


def create_default_items(user, default_food_list):
    defaultItems = [
        {'id': 'default-1', 'foodName': 'Apple', 'tag': 'apple', 'calories': 95, 'protein': 5, 'carbs': 25, 'fat': 3,
         'mealType': 'snack', 'healthRating': '3', 'isDefault': True, 'isActive': True},
        {'id': 'default-2', 'foodName': 'Banana', 'tag': 'banana', 'calories': 105, 'protein': 1, 'carbs': 27, 'fat': 0,
         'mealType': 'snack', 'healthRating': '3', 'isDefault': True, 'isActive': True},
        {'id': 'default-3', 'foodName': 'Chicken Breast', 'tag': 'chicken-breast', 'calories': 165, 'protein': 31,
         'carbs': 0, 'fat': 3, 'mealType': 'lunch', 'healthRating': '3', 'isDefault': True, 'isActive': True},
        {'id': 'default-4', 'foodName': 'Salad', 'tag': 'salad', 'calories': 120, 'protein': 2, 'carbs': 10, 'fat': 8,
         'mealType': 'lunch', 'healthRating': '3', 'isDefault': True, 'isActive': True},
        {'id': 'default-5', 'foodName': 'Oatmeal', 'tag': 'oatmeal', 'calories': 150, 'protein': 5, 'carbs': 27,
         'fat': 2, 'mealType': 'breakfast', 'healthRating': '3', 'isDefault': True, 'isActive': True},
        {'id': 'default-6', 'foodName': 'Greek Yogurt', 'tag': 'greek-yogurt', 'calories': 100, 'protein': 15,
         'carbs': 5, 'fat': 0, 'mealType': 'snack', 'healthRating': '3', 'isDefault': True, 'isActive': True},
        {'id': 'default-7', 'foodName': 'Eggs (2)', 'tag': 'eggs', 'calories': 155, 'protein': 13, 'carbs': 1,
         'fat': 11, 'mealType': 'breakfast', 'healthRating': '3', 'isDefault': True, 'isActive': True},
        {'id': 'default-8', 'foodName': 'Avocado Toast', 'tag': 'avocado-toast', 'calories': 190, 'protein': 5,
         'carbs': 15, 'fat': 10, 'mealType': 'breakfast', 'healthRating': '3', 'isDefault': True, 'isActive': True}]

    defaultContainers = [
        {'id': 'default-1', 'amount': 250, 'label': 'Small Glass (250ml)', 'icon': 'fa-tint-slash', 'isActive': True},
        {'id': 'default-2', 'amount': 500, 'label': 'Large Glass (500ml)', 'icon': 'fa-tint', 'isActive': True},
        {'id': 'default-3', 'amount': 750, 'label': 'Bottle (750ml)', 'icon': 'fa-glass-water', 'isActive': True},
        {'id': 'default-4', 'amount': 1000, 'label': 'Large Bottle (1000ml)', 'icon': 'fa-bottle-water',
         'isActive': True}]

    # Create or update default foods
    for item in defaultItems:
        if item['foodName'] not in default_food_list:
            item['isActive'] = False

        food, created = FoodEntry.objects.get_or_create(user=user, entry_id=item['id'])

        food.entry_id = item['id']
        food.user = user
        food.food_name = item['foodName']
        food.calories = item['calories']
        food.protein = item['protein']
        food.carbs = item['carbs']
        food.fat = item['fat']
        food.meal_type = item['mealType']
        food.health_rating = item['healthRating']
        food.is_default = item['isDefault']
        food.is_active = item['isActive'] if item['isActive'] is not None else True
        food.is_quick_add = True

        food.save()

    # Create or update default containers
    for item in defaultContainers:
        container, created = WaterContainer.objects.get_or_create(user=user, container_id=item['id'])

        container.container_id = item['id']
        container.user = user
        container.amount = item['amount']
        container.label = item['label']
        container.icon = item['icon']
        container.is_active = item['isActive'] if item['isActive'] is not None else True
        container.is_default = True

        container.save()
