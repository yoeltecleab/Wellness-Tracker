from django.shortcuts import render

# Create your views here.


def dashboard(request):
    return render(request, 'core/dashboard.html')


def index(request):
    return render(request, 'core/index.html')


def signUp(request):
    return render(request, 'core/signup.html')


def signin(request):
    return render(request, 'core/signup.html')



def waterLogging(request):
    return render(request, 'core/water_logging.html')


def onboarding_quiz(request):
    return render(request, 'core/onboarding_quiz.html')