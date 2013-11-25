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
				var futures=[];
				client.query("select * from users ORDER BY id", function(err,ret)
				{
					client.query("select nummessages from usermessageamounts ORDER BY userid", function(err, ret2)
					{
						for(var i=0, len=ret.rows.length; i<len; ++i)
						{
							futures[i]=new Future();
							ret.rows[i].nummessages=ret2.rows[i].nummessages;
							(function(i)
							{
								client.query("select message from messages where id=(select messageid from usermessages where userid=" +
									ret.rows[i].id + " AND messagenum=(select floor(random()*" + ret.rows[i].nummessages + ")))",
								function(err, ret3)
								{
									if(ret3.rows[0])
									{
										futures[i].resolver()(ret3.rows[0].message);
									} else futures[i].resolver()("Undefined");
								});
							})(i);
						}
						ret.rows=ret.rows.sort(sortfunc);
						fut.return(ret);
					});
				});
				var res=fut.wait();
				var result2=Future.wait(futures);
				for(var i=0, len=futures.length; i<len; ++i)
				{
					res.rows[i].randommessage=futures[i].error;
				}
				return res;
			}
		});
	});
});
