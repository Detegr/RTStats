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
