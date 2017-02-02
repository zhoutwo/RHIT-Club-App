CREATE PROCEDURE dbo.getClubInformation
	@clubName varchar(50)
AS
SELECT c.club_name, c.club_type, c.description, c.SignUpUser, c.SubscribeUser, m.rose_username
FROM dbo.Club_List_View c, dbo.Club_in_Charge_View m
WHERE c.club_name = @clubName AND m.club_name = @clubName
GO
