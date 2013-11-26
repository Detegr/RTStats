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
			randommessages: function(rows) {
				var futures=_.map(rows, function(row)
				{
					var future=new Future();
					client.query("select message from messages where id=(select messageid from usermessages where userid=" +
						row.userid + " AND messagenum=(select floor(random()*" + row.nummessages + ")))",
					function(err, ret)
					{
						if(err) {
							future.resolver(err);
							return;
						}
						if(ret.rows[0])
						{
							future.resolver()(err, ret.rows[0].message);
						}
						else future.resolver()(err, "Undefined");
					});
					return future;
				});
				Future.wait(futures);
				return futures;
			},
			users: function() {
				console.log("Users called");
				var userfut=new Future();
				client.query("select * from users ORDER BY id", function(err,ret)
				{
					userfut.return(ret);
				});
				var users=userfut.wait().rows;
				var amountfut=new Future();
				client.query("select * from usermessageamounts ORDER BY userid", function(err, ret)
				{
					amountfut.return(ret);
				});
				var amounts=amountfut.wait().rows;
				var msgfut=new Future();
				var msgs=Meteor.call("randommessages", amounts);
				for(var i=0, len=users.length; i<len; ++i)
				{
					users[i].nummessages=amounts[i].nummessages;
					users[i].randommessage=msgs[i].get();
				}
				return users;
			}
		});
	});
});
