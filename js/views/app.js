$(function(){
    //food model
    var Food = Backbone.Model.extend({
    defaults: {
        title: 0,
        meal: 'all',
        brand: 0,
        calories: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
        sugar: 0,
        html: ''
    },
        
    initialize: function() {
      /*if (!this.get("title")) {
        this.set({"title": this.defaults().title});
      }*/
    }
});
    
//log model
var LogEntry = Backbone.Model.extend({
    defaults: {
        title: 0,
        logdate: '',
        calories: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
        sugar: 0,
        content: {}
    },
    initialize: function() {
      /*if (!this.get("title")) {
        this.set({"title": this.defaults().title});
      }*/
    }
});
    
var AllFoods = Backbone.Collection.extend({
    model: Food,
    localStorage: new Backbone.LocalStorage("allfoods")
});
    
//collection for foods entered on a particular day
var FoodJournalDay = Backbone.Collection.extend({
    model: Food,
    localStorage: new Backbone.LocalStorage("foodjournalday")
});
    
//collection for journal entries
var FoodJournalCollection = Backbone.Collection.extend({
    model: LogEntry,
    localStorage: new Backbone.LocalStorage("foodjournal")
});

//collection for food searched
var SearchList = Backbone.Collection.extend({
    initialize: function(){
        this.bind("reset", function(model, options){
        });
    },
    //** 1. Function "parse" is a Backbone function to parse the response properly
    parse:function(response){
        //** return the array inside response, when returning the array
        //** we left to Backone populate this collection
        return response.hits;
    }

});
    
//variables for calories, protein, carbs, fat, and sugar
var totalcal = 0;
var totalprotein = 0;
var totalcarb = 0;
var totalfat = 0;
var totalsugar = 0;
    
// The main view of the application
var App = Backbone.View.extend({

    el: 'body',    

    template: _.template($('#item-template').html()),
    
    events: {
        "input #searchBox" : "prepCollection",
        "click #listing li" : "track",
        "click #save": "saveClicked",
        "click #savefoodday": "savefoodClicked",        
        "click .destroy": "destroy"
    },

    initialize: function () {        
        this.model = new SearchList();
        this.foods = new AllFoods();
        this.journal = new FoodJournalDay();
        this.journalCollection = new FoodJournalCollection();
        this.prepCollection = _.debounce(this.prepCollection, 1000);
        this.$totalcal = $('#totalcal span');
        this.$totalcalfat = $('#totalcalfat span');
        this.$totalprotein = $('#totalprotein span');
        this.$totalcarb = $('#totalcarb span');
        this.$totalfat = $('#totalfat span');
        this.$totalsugar = $('#totalsugar span');
        this.$totalsodium = $('#totalsodium span');
        this.$totalpotassium = $('#totalpotassium span');
        this.$list = $('#listing');
        this.$breakfast = $('#breakfast');
        this.$lunch = $('#lunch');
        this.$dinner = $('#dinner');
        this.$snack = $('#snack');
        this.$tracked = $('#tracked');
        
        this.listenTo(this.journal, 'all', _.debounce(this.render, 0));
        this.listenTo(this.journalCollection, 'all', _.debounce(this.render, 0));
        this.model.on('destroy', this.remove, this);
        this.listenTo(this.journal, 'destroy', this.renderfoods);        
        this.foods.fetch();        
        
        this.journal.fetch();
        this.journal.models.forEach(function(model){

            var mealli = model.get("html");
                                    
            var calcount = parseFloat(model.get("calories"));
            var proteincount = parseFloat(model.get("protein"));
            var carbscount = parseFloat(model.get("carbs"));
            var fatcount = parseFloat(model.get("fat"));
            var sugarcount = parseFloat(model.get("sugar"));

            
            totalcal += calcount;
            
            if (isNaN(proteincount) === false){
                totalprotein += proteincount;
            }
            
            if (isNaN(carbscount) === false){
                totalcarb += carbscount;
            }
            
            if (isNaN(fatcount) === false){
                totalfat += fatcount;
            }
            
            if (isNaN(sugarcount) === false){
                totalsugar += sugarcount;
            }
                        
            switch (model.get("meal")) {
                    
                case 'Breakfast':
                    $('#breakfast').append(mealli);
                    break;
                case 'Lunch':
                    $('#lunch').append(mealli);
                    break;
                case 'Dinner':
                        $('#dinner').append(mealli);
                    break;
                case 'Snack':
                    $('#snack').append(mealli);
                    break;
                default:
                    //alert("Please select a meal!");
            }
                
            $('#totalcal span').html(totalcal);
            $('#totalprotein span').html(totalprotein);
            $('#totalcarb span').html(totalcarb);
            $('#totalfat span').html(totalfat);
            $('#totalsugar span').html(totalsugar);
        });
        
        this.journalCollection.fetch();
        $('#historydiv').html(this.template({ 
            models: this.journalCollection.toJSON() 
        }));
        
    },
    
    //save journal collection entry
    savefoodClicked: function() {
        
        var datepicker = document.getElementById('datepicker');
        
        if (datepicker.value == ""){
            alert('Please select a date!');            
        } else {
            this.journalCollection.create(new Food({
                logdate: datepicker.value,
                calories: totalcal,
                fat: totalfat,
                carbs: totalcarb,
                protein: totalprotein,
                sugar: totalsugar,
                content: this.journal
            }));
            
            var length = this.journal.length;
            for (var i = 0; i < length; i++) {
                this.journal.at(0).destroy();
            }
            
            this.journalCollection.fetch();
            $('#historydiv').html(this.template({ 
                models: this.journalCollection.toJSON() 
            }));
            
            $("#logdiv").css({"display":"none"});
            $("#historydiv").css({"display":"block"});
            
            totalcal = 0;
            totalprotein = 0;
            totalcarb = 0;
            totalfat = 0;
            totalsugar = 0;
            
            $('#totalcal span').html("0");
            $('#totalprotein span').html("0");
            $('#totalcarb span').html("0");
            $('#totalfat span').html("0");
            $('#totalsugar span').html("0");
            
            document.getElementById('datepicker').value = "";
            document.getElementById('searchBox').value = "";
            $("ul").empty();            
        }
    },
        
    //save food/meal entry
    saveClicked: function() {
        this.listenTo(this.journal, 'add', this.renderfoods);

        var $target = $('#selectedfood li');
        var item_name = $target.attr('data-name');
        var brand_name = $target.attr('data-brand');
        var calorieString = $target.attr('data-calories');
        var calorieAmt = parseFloat(calorieString);
        var calorieFatString = $target.attr('data-caloriesfat');
        var calorieFatAmt = parseFloat(calorieFatString);
        var fatString = $target.attr('data-fat');
        var fatAmt = parseFloat(fatString);
        var sodiumString = $target.attr('data-sodium');
        var sodiumAmt = parseFloat(sodiumString);
        var proteinString = $target.attr('data-protein');
        var proteinAmt = parseFloat(proteinString);
        var potassiumString = $target.attr('data-potassium');
        var potassiumAmt = parseFloat(potassiumString);
        var carbsString = $target.attr('data-carbs');
        var carbsAmt = parseFloat(carbsString);
        var sugarString = $target.attr('data-sugar');
        var sugarAmt = parseFloat(sugarString);
        var foodid = $target.attr('data-id');

        var location = $target.attr('data-id');
        var currentFood = this.foods.get(location);

        var meal = document.getElementById('meal');
        var mealli = '<li data-id=' + '"' + foodid + '"' + 'style=" list-style: none;"><button class="destroy" type="button" data-id=' + '"' + foodid + '">X</button> <strong>' + item_name + '</strong>' + ' (' + brand_name + ')' + ' - ' + calorieString + ' Calories</li>';

        switch (meal.value) {
            case 'Breakfast':
                $('#breakfast').append(mealli);
                break;
            case 'Lunch':
                $('#lunch').append(mealli);
                break;
            case 'Dinner':
                 $('#dinner').append(mealli);
                break;
            case 'Snack':
                 $('#snack').append(mealli);
                break;
            default:
                alert("Please select a meal!");
        }

        this.journal.create(new Food({
            id: foodid,
            meal: meal.value,
            title: item_name,
            brand: brand_name,
            calories: calorieAmt,
            fat: fatAmt,
            sodium: sodiumAmt,
            protein: proteinAmt,
            carbs: carbsAmt,
            sugar: sugarAmt,
            html: mealli
        }));


        //hide modal
        $('#myModal').modal('hide');

    },

    destroy: function (e) {
        var $li = $(e.currentTarget).closest('li');
        var id = $li.attr('data-id');
        $li.remove();
        
        console.log("li id: " + id);
        console.log(this.journal);

        this.journal.get(id).destroy();
    },

    prepCollection: function(){
        var name = $('input').val();
        var newUrl = "https://api.nutritionix.com/v1_1/search/" + name + "?results=0%3A20&cal_min=0&cal_max=50000&fields=item_name%2Cbrand_name%2Citem_id%2Cbrand_id%2Cnf_calories%2Cnf_calories_from_fat%2Cnf_total_fat%2Cnf_sodium%2Cnf_potassium%2Cnf_total_carbohydrate%2Cnf_sugars%2Cnf_protein&appId=ea17c7bf&appKey=d73c7b9441f98b1e072d75bc5e042dda";

       if (name == ""){
        this.$list.html("")
       }
       else{
        this.model.url = newUrl;
        this.model.fetch({
            success: function (response, xhr) {
                //console.log("Inside success");
                //console.log(response.toJSON());
            },
            error: function (errorResponse) {
                console.log(errorResponse)
            }
        });
        this.listenTo(this.model, 'sync', this.rendersearch);
       }

    },

    track: function(e){
                 
        var $target = $(e.currentTarget);
        var item_name = $target.attr('data-name');
        var brand_name = $target.attr('data-brand');
        var calorieString = $target.attr('data-calories');
        var calorieAmt = parseFloat(calorieString);
        var calorieFatString = $target.attr('data-caloriesfat');
        var calorieFatAmt = parseFloat(calorieFatString);
        var fatString = $target.attr('data-fat');
        var fatAmt = parseFloat(fatString);
        var sodiumString = $target.attr('data-sodium');
        var sodiumAmt = parseFloat(sodiumString);
        var proteinString = $target.attr('data-protein');
        var proteinAmt = parseFloat(proteinString);
        var potassiumString = $target.attr('data-potassium');
        var potassiumAmt = parseFloat(potassiumString);
        var carbsString = $target.attr('data-carbs');
        var carbsAmt = parseFloat(carbsString);
        var sugarString = $target.attr('data-sugar');
        var sugarAmt = parseFloat(sugarString);
        var foodid = $target.attr('data-id');
        
        var trackedhtml = '<ul id=selectedfood><li style=" list-style: none;"' + ' data-id=' + '"' + foodid + '"' + ' data-name=' + '"' + item_name + '"' + ' data-brand=' + '"' + brand_name + '"' + ' data-calories=' + '"' + calorieString + '"' + ' data-caloriesfat=' + '"' + calorieFatString + '"' + ' data-fat=' + '"' + fatString + '"' + ' data-sodium=' + '"' + sodiumString + '"' + ' data-protein=' + '"' + proteinString + '"' + ' data-potassium=' + '"' + potassiumString + '"' + ' data-carbs=' + '"' + carbsString + '"' + ' data-sugar=' + '"' + sugarString + '"' + '>' + "<strong>" + item_name + '</strong>' + ' (' + brand_name + ')' + ' - ' + calorieString + ' Calories</li><ul>'
        
        var fooddiv = document.getElementById('dfood');
        fooddiv.innerHTML = trackedhtml;
        
        $('#myModal').modal('show');
     },
    
        
    renderfoods: function () { 

        this.journal.each(function (food) {            
            totalcal += food.get('calories');
            
            if (isNaN(food.get('protein')) === false){
                totalprotein += food.get('protein');
            }
            
            if (isNaN(food.get('carbs')) === false){
                totalcarb += food.get('carbs');
            }
            
            if (isNaN(food.get('fat')) === false){
                totalfat += food.get('fat');
            }
            
            if (isNaN(food.get('sugar')) === false){
                totalsugar += food.get('sugar');
            }            

        }, this)

        $('#totalcal span').html(totalcal);
        $('#totalprotein span').html(totalprotein);
        $('#totalcarb span').html(totalcarb);
        $('#totalfat span').html(totalfat);
        $('#totalsugar span').html(totalsugar);
    },    

	createOnEnter: function (e) {
		if (e.which === ENTER_KEY && this.$input.val().trim()) {
            this.foods.create(this.newAttributes());
            this.$input.val('');
        }
    },
    
    rendersearch: function(){       
        
        var terms = this.model;
        var wordhtml = "";
        
        terms.each(function (term) {
                wordhtml = wordhtml + '<li' + ' data-id=' + '"' + term.get('_id') + '"' + ' data-name=' + '"' + term.get('fields')['item_name'] + '"' + ' data-brand=' + '"' + term.get('fields')['brand_name'] + '"' + ' data-calories=' + '"' + term.get('fields')['nf_calories'] + '"' + ' data-caloriesfat=' + '"' + term.get('fields')['nf_calories_from_fat'] + '"' + ' data-fat=' + '"' + term.get('fields')['nf_total_fat'] + '"' + ' data-sodium=' + '"' + term.get('fields')['nf_sodium'] + '"' + ' data-protein=' + '"' + term.get('fields')['nf_protein'] + '"' + ' data-potassium=' + '"' + term.get('fields')['nf_potassium'] + '"' + ' data-carbs=' + '"' + term.get('fields')['nf_total_carbohydrate'] + '"' + ' data-sugar=' + '"' + term.get('fields')['nf_sugars'] + '"' + '>' + "<strong>" + term.get('fields')["item_name"] + '</strong>' + ' (' + term.get('fields')["brand_name"] + ')' + ' - ' + term.get('fields')["nf_calories"] + ' Calories' + '</li>'
            }, this);
            this.$list.html(wordhtml);
        }    
    
    })
    
    var app = new App();
});