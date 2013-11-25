Future=Npm.require("fibers/future");

Meteor.startup(function()
{
	var client=new pg.Client("postgres://postgres@localhost/loggerdb");
	client.connect(function(err)
	{
		Meteor.methods({
			users: function() {
				var fut=new Future();
				client.query("select * from users ORDER BY id", function(err,ret)
				{
					client.query("select nummessages from usermessageamounts ORDER BY userid", function(err, ret2)
					{
						for(var i=0, len=ret.rows.length; i<len; ++i)
						{
							ret.rows[i].nummessages=ret2.rows[i].nummessages;
						}
						console.log(ret);
						fut.return(ret);
					});
				});
				return fut.wait();
			}
		});
	});
});
