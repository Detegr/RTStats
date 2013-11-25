if(Meteor.isClient)
{
	Template.stats.users=function()
	{
		Meteor.call("users", function(err, result)
		{
			Session.set("users", result.rows);
		});
		return Session.get("users");
	};
}
