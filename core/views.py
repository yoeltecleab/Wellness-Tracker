from django.shortcuts import render

# Create your views here.
def home(request):
    return render(request, 'dashboard.html')

def index(request):
    return render(request, 'index.html')

def signUp(request):
    return render(request, 'signup.html')

def storePage(request):
    return render(request, 'storePage.html')

def waterLogging(request):
    return render(request, 'water_logging.html')