using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using RT_API; // Kendi namespace'ini kontrol et
using RT_API.Models;



namespace RT_API.Controllers
{

    


    [Route("api/[controller]")]
    [ApiController]
    public class TaskController : ControllerBase
    { 
    
        private readonly AppDbContext _context;
        private readonly IDistributedCache _cache;

        public TaskController(AppDbContext context, IDistributedCache cache)
        {
            _context = context;
            _cache = cache;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks()
        {
            string cacheKey = "all_tasks";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                // Redis'te veri bulundu! Direkt döndür.
                return JsonSerializer.Deserialize<List<TaskItem>>(cachedData)!;
            }

            // Redis'te yok, DB'den çek
            var tasks = await _context.tasks.ToListAsync();

            // Çekilen veriyi Redis'e 1 dakikalığına kaydet
            var options = new DistributedCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(1));

            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(tasks), options);

            return tasks;
        }

        [HttpPost]

        public async Task<ActionResult<TaskItem>> CreateTask(TaskItem task)
        {

            _context.tasks.Add(task);
            await _context.SaveChangesAsync();
            return Ok(task);

        }

    }
}




