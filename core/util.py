import random
from datetime import datetime, timedelta

from django.utils.timezone import make_aware

from .models import User, Profile, WaterLog, Food, FoodLog, Store


class CreateDemoUser:
    @staticmethod
    def run():
        # Delete all existing entries
        WaterLog.objects.all().delete()
        FoodLog.objects.all().delete()
        Food.objects.all().delete()
        Store.objects.all().delete()
        Profile.objects.all().delete()
        User.objects.all().delete()

        # Create a demo user
        user = User.objects.create(
            email="demo@example.com",
            username="demo",
            first_name="Demo",
            last_name="User",
            phone="1234567890",
            dob=datetime(1995, 5, 15),
            avatar="avatar.svg",
        )

        user.set_password("pass")
        user.save()

        # Set up profile with goals
        Profile.objects.create(
            user=user,
            water_goal=3500,
            calorie_goal=3000,
            primary_goal='health',
            current_diet='unsure',
            snacking='often',
            beverages='water, soda, juice, coffee',
            water_intake='less',
            dietary_restrictions='none',
            exercise='none',
            usual_store='Supermarket',

        )

        # Generate stores
        store_names = ["Walmart", "Target", "Costco", "Whole Foods", "Trader Joe's", "Safeway",
                       "7-Eleven", "CVS", "Kroger", "Aldi", "Publix", "Meijer", "Walgreens",
                       "Dollar General", "Dollar Tree", "Sprouts Farmers Market", "Giant Eagle", "H-E-B"]

        stores = []
        for name in store_names:
            store = Store.objects.create(
                user=user,
                name=name,
                address=f"{random.randint(100, 999)} Main St, ZIP {random.randint(10000, 99999)}",
                latitude=random.uniform(-90, 90),
                longitude=random.uniform(-180, 180),
                visits=random.randint(5, 50),
            )
            stores.append(store)

        # Generate food items
        food_names = ["Burger", "Salad", "Pizza", "Grilled Chicken", "Steak", "Soda", "Protein Shake",
                      "Fries", "Rice Bowl", "Ice Cream", "Pasta", "Soup", "Sandwich", "Tacos",
                      "Burrito", "Sushi", "Noodles", "Eggs", "Yogurt", "Oatmeal", "Pancakes",
                      "Waffles", "Fruit Salad", "Vegetable Stir-fry", "Roast Chicken", "Salmon",
                      "Shrimp", "Beans", "Lentils", "Avocado", "Bread", "Cheese", "Apple", "Banana",
                      "Orange", "Grapes", "Berries", "Potato", "Corn", "Broccoli"]
        foods = []
        for name in food_names:
            food = Food.objects.create(
                user=user,
                name=name,
                frequency=random.randint(1, 20),
                description=f"A {name}",
            )
            foods.append(food)

        # Generate daily logs for the past year
        start_date = datetime.now() - timedelta(days=365)
        for i in range(700):
            log_date = make_aware(start_date + timedelta(days=i))

            # Water logs
            daily_water_intake = 0
            water_entries = []
            for _ in range(random.randint(5, 10)):
                amount = random.choice([250, 500, 750])
                daily_water_intake += amount
                water_entries.append(WaterLog(user=user, amount=amount, created_at=log_date))
            WaterLog.objects.bulk_create(water_entries)

            # Food logs
            daily_calorie_intake = 0
            food_entries = []
            for _ in range(random.randint(8, 12)):
                food = random.choice(foods)
                homemade_or_purchased = random.choice(["Homemade", "Purchased"])
                calories = random.randint(400, 900) \
                    if homemade_or_purchased == "Purchased" else random.randint(200, 700)
                is_healthy = food.name in ["Burger", "Pizza", "Soda", "Fries", "Ice Cream", "Pasta", "Sandwich",
                                           "Tacos", "Burrito", "Pancakes", "Waffles", "Bread", "Cheese"] \
                    if homemade_or_purchased == "Purchased" else False
                daily_calorie_intake += calories
                food_entries.append(FoodLog(
                    user=user,
                    food=food,
                    calories=calories,
                    is_healthy=is_healthy,
                    homemade_or_purchased=homemade_or_purchased,
                    purchased_from=random.choice(stores),
                    created_at=log_date
                ))
            FoodLog.objects.bulk_create(food_entries)

        print("Demo user and logs created successfully!")
