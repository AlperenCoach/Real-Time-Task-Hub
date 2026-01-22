
using Microsoft.EntityFrameworkCore;
using RT_API.Models;
using RT_API.Controllers;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;



namespace RT_API
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        public DbSet<TaskItem> tasks { get; set; } = null!;
        public DbSet<TaskCounter> taskCounter { get; set; } = null!;
    
    }
}
