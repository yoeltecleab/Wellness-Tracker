import random
import uuid
from datetime import datetime, timedelta

from django.utils.timezone import make_aware

from .models import User, Profile, WaterLog, FoodEntry, Store, Goal


class CreateDemoUser:
    @staticmethod
    def run():
        # Delete all existing entries
        WaterLog.objects.all().delete()
        FoodEntry.objects.all().delete()
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
            dob=datetime(1995, 5, 15).date(),
            avatar="avatar.svg",
        )

        user.set_password("pass")
        user.save()

        # Set up profile with goals
        Profile.objects.create(
            user=user,
            primary_goal='health',
            current_diet='unsure',
            snacking='often',
            beverages='water, soda, juice, coffee',
            water_intake='less',
            dietary_restrictions='none',
            exercise='none',
            usual_store='Supermarket',
        )

        Goal.objects.create(
            user=user,
            calorie_goal='2250',
            water_goal='3200',
            protein_goal='50',
            carbs_goal='300',
            fat_goal='60',
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

        # Generate daily logs for the past year
        start_date = datetime.now() - timedelta(days=365)
        for i in range(700):
            log_date = make_aware(start_date + timedelta(days=i))

            # Water logs
            water_entries = []
            for _ in range(random.randint(5, 10)):
                amount = random.choice([250, 500, 750])
                water_entries.append(WaterLog(user=user, amount=amount, created_at=log_date))
            WaterLog.objects.bulk_create(water_entries)

            # Food logs
            food_entries = []
            for _ in range(random.randint(8, 12)):
                food_name = random.choice(food_names)
                purchased = random.choice([True, False])
                calories = random.randint(200, 500) if purchased else random.randint(80, 300)
                health_rating = random.choice(['Unhealthy', 'Neutral', 'Healthy', 'Unknown'])
                meal_type = random.choice(['Breakfast', 'Lunch', 'Dinner', 'Snack'])
                notes = random.choice([None, 'Extra cheese', 'Lightly seasoned'])
                protein = random.randint(5, 30)
                carbs = random.randint(10, 50)
                fat = random.randint(5, 40)
                frequency = random.randint(1, 100)

                food_entries.append(FoodEntry(
                    entry_id=str(uuid.uuid4()),
                    user=user,
                    food_name=food_name,
                    calories=calories,
                    purchased=purchased,
                    purchased_from=random.choice(stores) if purchased and stores else None,
                    health_rating=health_rating,
                    meal_type=meal_type,
                    notes=notes,
                    protein=protein,
                    carbs=carbs,
                    fat=fat,
                    frequency=frequency,
                    created_at=log_date
                ))

            FoodEntry.objects.bulk_create(food_entries)

        food_entries = []
        defaultItems = [
            {
                'id': 'default-1',
                'foodName': 'Apple',
                'calories': 95,
                'protein': 5,
                'carbs': 25,
                'fat': 3,
                'mealType': 'snack',
                'healthRating': '3',
                'isDefault': True
            },
            {
                'id': 'default-2',
                'foodName': 'Banana',
                'calories': 105,
                'protein': 1,
                'carbs': 27,
                'fat': 0,
                'mealType': 'snack',
                'healthRating': '3',
                'isDefault': True
            },
            {
                'id': 'default-3',
                'foodName': 'Chicken Breast',
                'calories': 165,
                'protein': 31,
                'carbs': 0,
                'fat': 3,
                'mealType': 'lunch',
                'healthRating': '3',
                'isDefault': True
            },
            {
                'id': 'default-4',
                'foodName': 'Salad',
                'calories': 120,
                'protein': 2,
                'carbs': 10,
                'fat': 8,
                'mealType': 'lunch',
                'healthRating': '3',
                'isDefault': True
            },
            {
                'id': 'default-5',
                'foodName': 'Oatmeal',
                'calories': 150,
                'protein': 5,
                'carbs': 27,
                'fat': 2,
                'mealType': 'breakfast',
                'healthRating': '3',
                'isDefault': True
            },
            {
                'id': 'default-6',
                'foodName': 'Greek Yogurt',
                'calories': 100,
                'protein': 15,
                'carbs': 5,
                'fat': 0,
                'mealType': 'snack',
                'healthRating': '3',
                'isDefault': True
            },
            {
                'id': 'default-7',
                'foodName': 'Eggs (2)',
                'calories': 155,
                'protein': 13,
                'carbs': 1,
                'fat': 11,
                'mealType': 'breakfast',
                'healthRating': '3',
                'isDefault': True
            },
            {
                'id': 'default-8',
                'foodName': 'Avocado Toast',
                'calories': 190,
                'protein': 5,
                'carbs': 15,
                'fat': 10,
                'mealType': 'breakfast',
                'healthRating': '3',
                'isDefault': True
            }
        ]

        for item in defaultItems:
            food_entries.append(FoodEntry(
                entry_id=item['id'],
                user=user,
                food_name=item['foodName'],
                calories=item['calories'],
                protein=item['protein'],
                carbs=item['carbs'],
                fat=item['fat'],
                meal_type=item['mealType'],
                health_rating=item['healthRating'],
                is_default=item['isDefault'],
                is_active=True,
                is_quick_add=True,
            ))

        FoodEntry.objects.bulk_create(food_entries)

        print("Demo user and logs created successfully!")
