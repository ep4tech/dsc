module.exports=(e)=>{
 const u=e.auth;
 if(!u||!u.getBool('is_active')||!['admin','super_admin'].includes(u.getString('role')))
 throw new ForbiddenError('Only active administrators can access database backups.');
};
