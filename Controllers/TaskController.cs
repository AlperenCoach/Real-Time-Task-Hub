using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using RT_API; // Kendi namespace'ini kontrol et
using RT_API.Models;



namespace RT_API.Controllers
{

    [ApiController]
    [Route("api/tasks")]
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
            try
            {
                // ID ve createdat otomatik oluşturulacak
                if (task.id == Guid.Empty)
                {
                    task.id = Guid.NewGuid();
                }
                if (task.createdat == default(DateTime))
                {
                    task.createdat = DateTime.UtcNow;
                }

                _context.tasks.Add(task);
                await _context.SaveChangesAsync();
                
                // Cache'i temizle
                await _cache.RemoveAsync("all_tasks");
                
                return Ok(task);
            }
            catch (Exception ex)
            {
                // Hata detaylarını logla
                Console.WriteLine($"Error creating task: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return BadRequest(new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }


        [HttpPut("{id}")]
        public async Task<ActionResult<TaskItem>> UpdateTask(Guid id, TaskItem task)
        {
            var existingTask = await _context.tasks.FindAsync(id);
            if (existingTask == null)
            {
                return NotFound();
            }

            // Eğer task tamamlandıysa (status true olduysa) ve önceden tamamlanmamışsa, counter'ı artır
            if (task.status == true && existingTask.status == false)
            {
                try
                {
                    Console.WriteLine($"Task completed! Existing status: {existingTask.status}, New status: {task.status}");
                    var counter = await _context.taskCounter.FirstOrDefaultAsync();
                    if (counter == null)
                    {
                        Console.WriteLine("Counter not found, creating new counter");
                        counter = new TaskCounter { id = 1, completedallTasks = 1 };
                        _context.taskCounter.Add(counter);
                    }
                    else
                    {
                        Console.WriteLine($"Counter found. Current count: {counter.completedallTasks}");
                        counter.completedallTasks++;
                        Console.WriteLine($"Counter incremented to: {counter.completedallTasks}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error updating counter: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    // Counter hatası olsa bile task güncellemesi devam etsin
                }
            }

            existingTask.title = task.title;
            existingTask.status = task.status;
            existingTask.day = task.day;
            existingTask.description = task.description;

            await _context.SaveChangesAsync();
            
            // Cache'i temizle
            await _cache.RemoveAsync("all_tasks");
            
            return Ok(existingTask);
        }


        [HttpDelete("{id}")]
        public async Task<ActionResult<TaskItem>> DeleteTask(Guid id)
        {
            var existingTask = await _context.tasks.FindAsync(id);
            if (existingTask == null)
            {
                return NotFound();
            }

            // Task silinirken counter'ı azaltmıyoruz (all-time tracking)
            // Sadece task'ı siliyoruz

            _context.tasks.Remove(existingTask);
            await _context.SaveChangesAsync();
            
            // Cache'i temizle
            await _cache.RemoveAsync("all_tasks");
            
            return Ok(existingTask);
        }

        [HttpGet("counter")]
        public async Task<ActionResult<int>> GetTotalCompletedTasks()
        {
            try
            {
                Console.WriteLine("Counter endpoint called");
        
                var completedTasks = await _context.tasks.AsNoTracking().Where(t => t.status == true).CountAsync();

                // Direkt integer olarak döndür (ASP.NET Core otomatik serialize eder)
                return Ok(completedTasks);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting counter: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return Ok(new { completedallTasks = 0 });
            }
        }

        

    }
}









