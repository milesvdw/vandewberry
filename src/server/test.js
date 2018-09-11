const express = require('express');
const bodyParser = require('body-parser');

const https = require('https');
var mysql = require('mysql');
var util = require('util')
const readline = require('readline');

function constructRecipeFromRows(rows) {
    //expects a list of rows, with each row having one unique recipe-material-ingredientgroup-ingredient combination
    recipe = {};
    recipe.id = rows[0].recipeId;
    recipe.description = rows[0].recipeDescription // NOTE: I'm probably sending over duplicate descriptions which could get expensive idk
    recipe.name = rows[0].recipeName
    recipe.calories = rows[0].recipeCalories
    recipe.lastEaten = rows[0].lastEaten
    recipe.householdId = rows[0].householdId

    let materialIds = rows.map((r) => r.materialId).unique(); // non-unique list of recipe ids
    recipe.materials = []
    materialIds.forEach((id) =>
        recipe.materials.push(constructMaterialFromRows(rows.filter((row) =>
            row.id === id))))
    return recipe;
}

function constructMaterialFromRows(rows) {
    material = {}
    material.id = rows[0].materialId
    material.quantity = rows[0].materialQuantity
    material.required = rows[0].materialRequired

    let ingredientgroupIds = rows.map((r) => r.ingredientGroupId) // non-unique list of recipe ids
    ingredientgroupIds = ingredientgroupIds.unique();

    material.ingredientGroups = []
    ingredientgroupIds.forEach((id) =>
        material.ingredientGroups.push(constructIngredientGroupFromRows(rows.filter((row) =>
            row.ingredientGroupId === id))))
    return material;
}

function constructIngredientGroupFromRows(rows) {
    ingredientGroup = {};
    ingredientGroup.id = rows[0].ingredientGroupId;
    ingredientGroup.name = rows[0].ingredientGroupName;

    return ingredientGroup;
}

Array.prototype.unique = function () {
    return this.filter((value, index) => this.indexOf(value) === index);
}