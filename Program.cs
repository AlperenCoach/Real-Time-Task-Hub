using Microsoft.EntityFrameworkCore; // Bu satırı ekle
using RT_API; // AppDbContext hangi namespace altındaysa onu ekle

var builder = WebApplication.CreateBuilder(args);

// Kestrel'i tüm network interface'lerinde dinlemesi için yapılandır
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5086); // Tüm IP adreslerinde 5086 portunu dinle
});

// 1. Veritabanı Bağlantısını Kaydet (BURAYI EKLEDİK)
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = "localhost:6379";
    options.InstanceName = "TaskHub_";
});

// AppDbContext'i DI container'a kaydet
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Mevcut servisler
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

// Development için HTTPS redirection'ı devre dışı bırak
// app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
