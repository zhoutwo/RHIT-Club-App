CREATE PROCEDURE dbo.fetchRegisteredUser
	@username varchar(10)
AS
SELECT u.rose_username, u.name, u.email, 
	CASE 
		WHEN l.Sign_Up = 1 THEN l.club_name
	END,
	CASE 
		WHEN l.Subscribe = 1 THEN l.club_name
	END,
	c.club_name, c.title
/* Could make this a JOIN */
FROM dbo.User_View u, dbo.Club_List_View l, dbo.Club_in_Charge_View c
WHERE u.rose_username = @username AND c.rose_username = @username AND l.SignUpUser = @username AND l.SubscribeUser = @username
GO
