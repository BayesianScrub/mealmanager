# -*- coding: utf-8 -*-
# Generated by Django 1.11.6 on 2017-10-27 01:29
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0005_recipeingredient_quantity_amount'),
    ]

    operations = [
        migrations.AlterField(
            model_name='recipeingredient',
            name='quantity_amount',
            field=models.TextField(max_length=8),
        ),
    ]
