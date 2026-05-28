from django.db import models

CATEGORIES = [
    ('breakfast', 'Breakfast'), ('lunch', 'Lunch'), 
    ('evening_snacks', 'Snacks'), ('chaat', 'Chaat'),
    ('beverages', 'Refreshing Drinks'), ('juices', 'Juices'), ('desserts', 'Desserts'),
    ('bites', 'Bites'), ('chinese', 'Chinese'),
    ('pizza', 'Pizza'), ('burgers', 'Burgers'),
    ('parotta', 'Parotta'), ('roti', 'Roti & Naan'),
    ('combo', 'Combo Meal'),
]

class MenuItem(models.Model):
    item_name     = models.CharField(max_length=100)
    category      = models.CharField(max_length=50, choices=CATEGORIES, default='lunch')
    price         = models.DecimalField(max_digits=8, decimal_places=2)
    is_veg        = models.BooleanField(default=True)
    food_type     = models.CharField(max_length=20, choices=[('veg', 'Veg'), ('egg', 'Egg'), ('non_veg', 'Non-Veg')], default='veg')
    availability  = models.BooleanField(default=True)
    image         = models.ImageField(upload_to='menu/', blank=True, null=True)
    description   = models.TextField(blank=True)
    prep_time_mins = models.PositiveIntegerField(default=5)
    
    # Combo meals support
    combo_items   = models.JSONField(blank=True, null=True, default=list)
    
    created_at    = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.is_veg = (self.food_type == 'veg')
        super().save(*args, **kwargs)


    def __str__(self):
        return f"{self.item_name} - ₹{self.price}"

    class Meta:
        ordering = ['category', 'item_name']
