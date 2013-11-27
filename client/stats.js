if(Meteor.isClient)
{
	Meteor.Router.add({
		"/": "stats",
		"/search": function() {
			Session.set("searchStr", this.querystring.split("=")[1]); // TODO: Stupid
			return "search";
		}
	});

	Template.stats.users=function()
	{
		Meteor.call("users", function(err, result)
		{
			Session.set("users", result);
		});
		return Session.get("users");
	};

	Template.monthChart.rendered=function()
	{
		Meteor.call("getThisYearCounts", function(err, ret)
		{
			var data = {
				labels : ["January","February","March","April","May","June","July","August","September","October","November","December"],
				datasets : [
					/*{
						fillColor : "rgba(220,220,220,0.5)",
						strokeColor : "rgba(220,220,220,1)",
						pointColor : "rgba(220,220,220,1)",
						pointStrokeColor : "#fff",
						data : [65,59,90,81,56,55,40]
					},*/
					{
						fillColor : "rgba(151,187,205,0.5)",
						strokeColor : "rgba(151,187,205,1)",
						pointColor : "rgba(151,187,205,1)",
						pointStrokeColor : "#fff",
						data : ret
					}
				]
			};
			var ctx = $("#monthChart").get(0).getContext("2d");
			new Chart(ctx).Line(data);
		});
		return "DONE";
	};

	Template.search.events= {
		"submit form": function(e) {
			e.preventDefault();
			var str=$("#searchstr").val();
			Meteor.Router.to("/search?str=" + str);
		}
	};

	Template.search.results=function()
	{
		Meteor.call("searchLog", Session.get("searchStr"), function(err, result)
		{
			Session.set("searchResults", result);
		});
		return Session.get("searchResults");
	};
}
