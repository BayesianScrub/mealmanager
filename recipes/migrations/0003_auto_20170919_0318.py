# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2017-09-19 03:18
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0002_auto_20170919_0310'),
    ]

    operations = [
        migrations.AlterField(
            model_name='recipe',
            name='cook_time',
            field=models.DurationField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='recipe',
            name='prep_time',
            field=models.DurationField(blank=True, null=True),
        ),
    ]
