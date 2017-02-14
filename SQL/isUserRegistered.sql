CREATE PROCEDURE dbo.getUserRegistered
	@username varchar(10)
AS
BEGIN
	SET NOCOUNT ON;
	SELECT rose_username
	FROM dbo.User_View
	WHERE rose_username = @username
END
GO
