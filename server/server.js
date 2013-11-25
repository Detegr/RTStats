Future=Npm.require("fibers/future");

Meteor.startup(function()
{
	function sortfunc(a,b)
	{
		if(a.nummessages < b.nummessages) return 1;
		else if(a.nummessages === b.nummessages) return 0;
		else return -1;
	}

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
						ret.rows=ret.rows.sort(sortfunc);
						fut.return(ret);
					});
				});
				return fut.wait();
			}
		});
	});
});
